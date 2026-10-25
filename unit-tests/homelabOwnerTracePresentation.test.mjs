import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
test("Site trace ID is ephemeral OWNER state, absent from public cache", () => {
  const hook = read("app/components/homelab/useHomelabHealth.ts");
  const ui = read("app/components/homelab/HomelabServicesBlock.tsx");
  assert.match(hook, /siteHealthTraceId: null/);
  assert.match(hook, /response.headers.get\("X-Nabla-Trace-ID"\)/);
  assert.match(ui, /!readOnly && \(/);
  assert.match(ui, /data-owner-site-trace/);
  assert.match(ui, /data-owner-trace-id/);
  assert.doesNotMatch(read("lib/homelabPublicBrowserCache.ts"), /siteHealthTraceId/);
});
