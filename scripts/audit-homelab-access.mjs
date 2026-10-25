#!/usr/bin/env node
/**
 * Run on an ACTUAL LAN/external workstation, never by spoofing proxy headers.
 * No cookies, storage values, IP addresses or authentication headers are logged.
 * Requires the project's Playwright browser installation.
 */
import { chromium } from "playwright";
import { auditHeadersForUrl, auditStoredEntries, classifyAuditAccess, safeRateLimitMetadata } from "./homelab-audit-policy.mjs";

const expected = process.env.HOMELAB_AUDIT_EXPECT?.trim();
const base = process.env.BASE_URL?.trim() || "https://www.albanandrieu.com";
const accessJwt = process.env.HOMELAB_AUDIT_ACCESS_JWT?.trim();
if (!["owner", "service", "denied"].includes(expected)) {
  console.error("Set HOMELAB_AUDIT_EXPECT=owner|service|denied"); process.exit(2);
}
const origin = new URL(base);
if ((origin.protocol !== "https:" && !(origin.protocol === "http:" && ["localhost", "127.0.0.1"].includes(origin.hostname))) ||
    origin.username || origin.password || origin.search || origin.hash || origin.pathname !== "/") {
  console.error("BASE_URL must be an HTTPS origin, or local loopback HTTP"); process.exit(2);
}
const failures = [];
const results = [];
let preflightBlocked = false;
class AuditPreflightBlocked extends Error {}
const assert = (condition, message) => { if (!condition) failures.push(message); };
const audit = (label, value) => { results.push({ check: label, result: value }); };
const headers = auditHeadersForUrl(origin.origin, origin.origin, accessJwt, { Accept: "application/json" });
const browser = await chromium.launch({ headless: true });
try {
  // Context is always fresh. Do not load another user's persistent Chrome profile.
  const context = await browser.newContext({ serviceWorkers: "block" });
  if (accessJwt) {
    // Do not forward Access JWT to other origins or across redirects.
    await context.route("**/*", async (route) => {
      if (new URL(route.request().url()).origin !== origin.origin) {
        await route.continue();
        return;
      }
      const upstream = await route.fetch({
        headers: auditHeadersForUrl(route.request().url(), origin.origin, accessJwt, route.request().headers()),
        maxRedirects: 0,
      });
      await route.fulfill({ response: upstream });
    });
  }
  const page = await context.newPage();
  const originUrl = (path) => new URL(path, origin).toString();
  const request = async (path) => {
    const response = await context.request.get(originUrl(path), { headers, maxRedirects: 0, timeout: 15_000 });
    const type = response.headers()["content-type"] ?? "";
    const body = type.includes("application/json") ? await response.json().catch(() => null) : null;
    return { status: response.status(), body, headers: response.headers() };
  };
  const decision = await request("/api/homelab-access?diagnose=1");
  const gate = classifyAuditAccess(decision.status, decision.body);
  if (!gate.ok) {
    audit("access", `BLOCKED (${gate.reason}; HTTP ${decision.status})`);
    const metadata = safeRateLimitMetadata(decision.headers);
    if (Object.keys(metadata).length) audit("safe response metadata", JSON.stringify(metadata));
    throw new AuditPreflightBlocked(gate.reason);
  }
  const observed = gate.mode;
  audit("access", observed);
  if (observed !== expected) {
    assert(false, `expected ${expected}, observed ${observed}; check real network and verified Access identity`);
    throw new AuditPreflightBlocked("mode_mismatch");
  }
  const privatePaths = [
    "/api/homelab-health", "/api/homelab-probes",
    "/api/homelab-diagnostics", "/api/homelab-observability",
    "/api/runtime-topology",
  ];
  for (const path of privatePaths) {
    const response = await request(path);
    if (expected !== "owner") {
      assert(response.status === 404, path + " must return private 404");
      const serialized = JSON.stringify(response.body ?? {});
      assert(!/172\.17\.|internalHost|token|jwt|truenas_runtime|probe_summary/i.test(serialized),
        path + " returned OWNER details");
    } else {
      // FastAPI upstream can be unavailable: distinguish connectivity from access.
      assert(response.status === 200 || response.status === 503,
        path + " must authorize OWNER (200 or source-unavailable 503), got " + response.status);
    }
    audit(path, String(response.status));
  }
  const publicHealth = await request("/api/homelab-health-v2");
  if (expected === "denied") {
    assert(publicHealth.status === 404, "strict denial must also reject SERVICE v2");
  } else {
    assert([200, 503].includes(publicHealth.status), "SERVICE v2 must return 200 or source-unavailable 503");
  }
  const traceId = publicHealth.headers["x-nabla-trace-id"];
  if (traceId) assert(/^[0-9a-f]{32}$/.test(traceId), "malformed site trace ID");
  audit("health-v2", String(publicHealth.status) + (traceId ? " (trace ID received)" : " (no trace ID)"));
  for (const path of ["/fr/truenas", "/truenas", "/fr/architecture", "/architecture"]) {
    const response = await page.goto(originUrl(path), { waitUntil: "domcontentloaded", timeout: 30_000 });
    assert(response?.status() === 200, path + " did not render 200");
    await page.waitForTimeout(1800);
    if (expected === "denied") {
      // PAGE may include public marketing content but not a private view.
      assert(await page.locator("[data-homelab-private-view]").count() === 0,
        path + " rendered a protected homelab view");
    }
    audit(path, response?.status() === 200 ? "HTTP 200" : "not 200");
  }
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1800);
  const persisted = await page.evaluate(async () => {
    const violations = [], entries = [];
    const scoped = /homelab|(?:^|[:_-])(owner|truenas|diagnostic)(?:$|[:_-])/i;
    for (const [name, storage] of [["localStorage", localStorage], ["sessionStorage", sessionStorage]]) {
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && scoped.test(key)) entries.push([name, key, storage.getItem(key) ?? ""]);
      }
    }
    if (typeof indexedDB.databases === "function") {
      for (const db of await indexedDB.databases()) {
        if (/homelab.*(owner|private)/i.test(db.name ?? "")) violations.push("IndexedDB: OWNER database");
      }
    } else violations.push("IndexedDB: enumeration unsupported");
    if (typeof caches !== "undefined") {
      const names = await caches.keys();
      if (names.length > 100) violations.push("CacheStorage: over audit budget");
      for (const name of names.slice(0, 100)) {
        if (/homelab.*(owner|private)/i.test(name)) violations.push("CacheStorage: OWNER cache");
        const requests = await (await caches.open(name)).keys();
        if (requests.length > 300) violations.push("CacheStorage: over request budget");
        for (const req of requests.slice(0, 300)) {
          if (/^\/api\/(?:homelab-(?:health|probes|diagnostics|observability)|runtime-topology)(?:\/|$)/.test(new URL(req.url).pathname))
            violations.push("CacheStorage: OWNER API response cached");
        }
      }
    }
    return { entries, violations };
  });
  const violations = [
    ...persisted.violations,
    ...auditStoredEntries(persisted.entries.filter(([scope]) => scope === "localStorage").map(([, key, value]) => [key, value]), "localStorage"),
    ...auditStoredEntries(persisted.entries.filter(([scope]) => scope === "sessionStorage").map(([, key, value]) => [key, value]), "sessionStorage"),
  ];
  assert(violations.length === 0, "browser persistence check: " + violations.join(", "));
  audit("browser persistence (reload)", violations.length ? "VIOLATIONS" : "PASS; no operational cache values");
  await context.close();
} catch (error) {
  if (error instanceof AuditPreflightBlocked) {
    preflightBlocked = true;
  } else failures.push(error instanceof Error ? error.name + ": " + error.message.replace(/https?:\/\/[^\s]+/g, "[url]") : "unexpected audit exception");
} finally {
  await browser.close();
}
for (const line of results) console.log((line.result.startsWith("VIOLATIONS") ? "FAIL" : "CHECK") + " " + line.check + ": " + line.result);
if (failures.length) {
  for (const message of failures) console.error("FAIL " + message);
  process.exitCode = 1;
} else if (preflightBlocked) {
  console.error("HOMELAB_ACCESS_AUDIT_BLOCKED: no access verdict; no subsequent probe requests. Investigate rate limiting and Retry-After, then run once from the real LAN.");
  process.exitCode = 4;
} else console.log("HOMELAB_ACCESS_AUDIT_PASS: " + expected + " (environment observed, not simulated)");
