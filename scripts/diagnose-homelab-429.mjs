#!/usr/bin/env node
/**
 * Two independent HTTP observations from THIS machine.
 * This is not a browser OWNER or external-WAN acceptance test.
 * No retries, redirections, cookies, tokens or response bodies are printed.
 */
import { auditHeadersForUrl, safeRateLimitMetadata } from "./homelab-audit-policy.mjs";

const base = process.env.BASE_URL?.trim() || "https://www.albanandrieu.com";
const origin = new URL(base);
if (!["https:", "http:"].includes(origin.protocol) ||
    (origin.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(origin.hostname)) ||
    origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) {
  console.error("BASE_URL must be a trusted HTTPS origin or local loopback HTTP");
  process.exit(2);
}

async function observe(label, url, jwt = "") {
  try {
    const headers = auditHeadersForUrl(url, origin.origin, jwt, { Accept: "application/json" });
    const response = await fetch(url, {
      method: "GET", headers, redirect: "manual", cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    const safe = safeRateLimitMetadata(Object.fromEntries(response.headers));
    const result = { status: response.status, ...safe };
    console.log(label, JSON.stringify(result));
    return response.status;
  } catch (error) {
    console.log(label, JSON.stringify({ result: "unreachable",
      stage: error?.name === "TimeoutError" ? "timeout" : "transport" }));
    return null;
  }
}

// Bounded independent probes from this machine; no header spoofing or redirects.
// Target a single upstream to avoid unnecessary requests during local diagnosis.
const flags = new Set(process.argv.slice(2));
const allowed = new Set(["--site-only", "--fastapi-only", "--help"]);
if ([...flags].some((flag) => !allowed.has(flag)) ||
    (flags.has("--site-only") && flags.has("--fastapi-only")) ||
    (flags.has("--help") && flags.size !== 1)) {
  console.error("Usage: diagnose-homelab-429.mjs [--site-only|--fastapi-only|--help]");
  process.exit(2);
}
if (flags.has("--help")) {
  console.log("Usage: diagnose-homelab-429.mjs [--site-only|--fastapi-only]");
  console.log("One or two independent GET probes; no retries or private LAN probes.");
  process.exit(0);
}
const onlySite = flags.has("--site-only");
const onlyFastApi = flags.has("--fastapi-only");
const [site, fastapi] = await Promise.all([
  onlyFastApi ? Promise.resolve("SKIPPED") : observe("SITE_ACCESS",
    new URL("/api/homelab-access?diagnose=1", origin).toString(),
    process.env.HOMELAB_AUDIT_ACCESS_JWT?.trim()),
  onlySite ? Promise.resolve("SKIPPED") : observe("FASTAPI_LIVEZ",
    "https://fastapi-sample.fastapicloud.dev/livez"),
]);
console.log("NOTE: FastAPI /livez is an independent liveness signal, not proof of Site OWNER authorization or Backstage v2 health.");
if (site === 429) {
  console.log("BLOCKED: Site access preflight rate-limited; honor Retry-After and inspect Vercel/edge logs.");
  process.exitCode = 4;
} else if (site === null || fastapi === null) {
  process.exitCode = 3;
}
