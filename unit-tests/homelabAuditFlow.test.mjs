import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const source = readFileSync(new URL("../scripts/audit-homelab-access.mjs", import.meta.url), "utf8");

test("rate-limited access gate aborts before OWNER probes and page navigation", () => {
  const gate = source.indexOf("if (!gate.ok)");
  const stopped = source.indexOf('throw new AuditPreflightBlocked(gate.reason)', gate);
  const probes = source.indexOf("const privatePaths");
  assert.ok(gate >= 0 && stopped > gate && probes > stopped);
  assert.match(source, /process.exitCode = 4/);
  assert.match(source, /safeRateLimitMetadata\(decision.headers\)/);
});

test("audit does not spoof IP or share JWT with foreign domains", () => {
  assert.doesNotMatch(source, /extraHTTPHeaders|X-Forwarded-For|x-real-ip/);
  assert.match(source, /new URL\(route.request\(\).url\(\)\).origin !== origin.origin/);
  assert.match(source, /maxRedirects: 0/);
});
