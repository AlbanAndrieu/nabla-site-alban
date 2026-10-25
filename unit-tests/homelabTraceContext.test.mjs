import assert from "node:assert/strict";
import test from "node:test";
import { createHomelabTrace, validHomelabTraceparent } from "../lib/homelabTraceContext.ts";

test("traceparent carries the same unique, nonzero Site trace ID", () => {
  const a = createHomelabTrace();
  const b = createHomelabTrace();
  assert.match(a.traceId, /^[a-f0-9]{32}$/);
  assert.equal(a.traceparent.split("-")[1], a.traceId);
  assert.equal(validHomelabTraceparent(a.traceparent), true);
  assert.notEqual(a.traceId, b.traceId);
});

test("malformed and client-injected traceparents are rejected", () => {
  for (const value of [
    null, "", "malformed",
    "00-00000000000000000000000000000000-1234567812345678-01",
    "00-12345678123456781234567812345678-0000000000000000-01",
    "00-12345678123456781234567812345678-1234567812345678-ff",
    "00-12345678123456781234567812345678-1234567812345678-01\r\nX-Diagnostics-Key:secret",
  ]) assert.equal(validHomelabTraceparent(value), false);
});

test("Site health route propagates the generated trace, never request header", async () => {
  const { readFileSync } = await import("node:fs");
  const route = readFileSync(new URL("../app/api/homelab-health-v2/route.ts", import.meta.url), "utf8");
  const source = readFileSync(new URL("../lib/siteHealthV2Server.ts", import.meta.url), "utf8");
  assert.match(route, /createHomelabTrace\(\)/);
  assert.match(route, /loadSiteHealthV2\(trace.traceparent\)/);
  assert.match(route, /"X-Nabla-Trace-ID": trace.traceId/);
  assert.match(source, /validHomelabTraceparent\(traceparent\)/);
  assert.doesNotMatch(route, /request\.headers\.get\(["']traceparent/);
});
