import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
test("only matching FastAPI trace echo can confirm end-to-end propagation", () => {
  const upstream = read("lib/siteHealthV2Server.ts");
  const route = read("app/api/homelab-health-v2/route.ts");
  assert.match(upstream, /response.headers.get\("X-Nabla-Trace-ID"\) === traceparent.split\("-"\)\[1\]/);
  assert.match(route, /confirmed \? "confirmed" : "sent"/);
  assert.match(route, /let confirmed = false/);
});
test("trace confirmation is OWNER-only and cleared in SERVICE", () => {
  const state = read("app/components/homelab/useHomelabHealth.ts");
  const owner = read("app/components/homelab/HomelabServicesBlock.tsx");
  assert.match(state, /siteHealthTraceConfirmed: false/);
  assert.match(owner, /siteHealthTraceConfirmed/);
  assert.match(owner, /data-owner-site-trace/);
  assert.doesNotMatch(read("lib/homelabPublicBrowserCache.ts"), /siteHealthTraceConfirmed/);
});
