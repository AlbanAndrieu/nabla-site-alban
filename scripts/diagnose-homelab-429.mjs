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

// No network-header spoofing; an Access JWT, if provided, is Site-origin only.
const site = await observe("SITE_ACCESS",
  new URL("/api/homelab-access?diagnose=1", origin).toString(),
  process.env.HOMELAB_AUDIT_ACCESS_JWT?.trim());
const fastapi = await observe("FASTAPI_LIVEZ",
  "https://fastapi-sample.fastapicloud.dev/livez");
console.log("NOTE: FastAPI /livez is an independent liveness signal, not proof of Site OWNER authorization or Backstage v2 health.");
if (site === 429) {
  console.log("BLOCKED: Site access preflight rate-limited; honor Retry-After and inspect Vercel/edge logs.");
  process.exitCode = 4;
} else if (site === null || fastapi === null) {
  process.exitCode = 3;
}
