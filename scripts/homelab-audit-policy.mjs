/** Security helpers for a real-network Playwright homelab audit. */
export function auditHeadersForUrl(requestUrl, expectedOrigin, jwt, existingHeaders = {}) {
  const target = new URL(requestUrl);
  if (target.origin !== expectedOrigin || !jwt) return { ...existingHeaders };
  return { ...existingHeaders, "cf-access-jwt-assertion": jwt };
}
export function expectedAccessMode(body) {
  if (!body || typeof body !== "object" || body.trusted !== true) return "denied";
  return body.mode === "public-readonly" ? "service" : "owner";
}
export function auditStoredEntries(entries, storageName) {
  const findings = [];
  const allowed = /^nabla:homelab:(catalog-public-v2:3|health-public-v2:1)$/;
  const scoped = /homelab|(?:^|[:_-])(owner|truenas|diagnostic)(?:$|[:_-])/i;
  const secrets = /172\.17\.|10\.254\.|cf-access|x-diagnostics-key|(?:access|refresh)[_-]?token|private_inventory|internalHost|service_token|BEGIN PRIVATE KEY/i;
  for (const [key, value] of entries) {
    if (scoped.test(key) && !allowed.test(key)) findings.push(`${storageName}: unexpected operational key`);
    if (scoped.test(key) && secrets.test(value)) findings.push(`${storageName}: private data pattern`);
  }
  return findings;
}

/** 429 is a transport/rate-limit block, never an identity decision. */
export function classifyAuditAccess(status, body) {
  if (status === 429) return { ok: false, reason: "rate_limited", mode: null };
  if (status !== 200) return { ok: false, reason: "http_" + (Number.isInteger(status) ? status : "unknown"), mode: null };
  if (!body || typeof body !== "object" || typeof body.trusted !== "boolean")
    return { ok: false, reason: "invalid_access_payload", mode: null };
  return { ok: true, reason: "evaluated", mode: expectedAccessMode(body) };
}

/** Only vetted metadata: no cookies, authorization or arbitrary server headers. */
export function safeRateLimitMetadata(headers = {}) {
  const get = (name) => typeof headers[name] === "string" ? headers[name] : "";
  const retry = get("retry-after");
  const vercelId = get("x-vercel-id");
  const ray = get("cf-ray");
  const data = {};
  if (/^\d{1,5}$/.test(retry) && Number(retry) <= 86400)
    data.retryAfterSeconds = Number(retry);
  if (/^[a-z0-9:.-]{3,100}$/i.test(vercelId)) data.vercelRequestId = vercelId;
  if (/^[a-f0-9-]{8,50}$/i.test(ray)) data.cloudflareRay = ray;
  return data;
}
