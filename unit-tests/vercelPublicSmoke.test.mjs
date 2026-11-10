import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { SITES, parseArgs, inspect } from "../scripts/finops/vercel-public-smoke.mjs";
const file = join(dirname(fileURLToPath(import.meta.url)), "../scripts/finops/vercel-public-smoke.mjs");

test("never probes without explicit opt-in or unlisted domains", () => {
  assert.equal(parseArgs([]), null);
  assert.equal(parseArgs(["--live", "--site", "file:///etc/passwd"]), null);
  assert.equal(parseArgs(["--live", "--site", "bababou"]), "bababou");
  assert.equal(Object.keys(SITES).length, 2);
  assert.ok(Object.values(SITES).every(s => s.paths.every(p => p.startsWith("/") && !p.includes("api/") && !p.includes("private"))));
  const result = spawnSync(process.execPath, [file], { encoding: "utf8" });
  assert.equal(result.status, 2);
  assert.equal(JSON.parse(result.stdout).status, "NOT_RUN");
});
test("route list uses bounded sequential HEAD only and sanitized cache labels", async () => {
  let calls = 0;
  const reply = await inspect("bababou", async (url, args) => {
    calls++;
    assert.ok(url.startsWith("https://www.bababou.com/"));
    assert.equal(args.method, "HEAD");
    assert.equal(args.redirect, "manual");
    return { status: 200, headers: { get: () => "HIT" } };
  });
  assert.equal(calls, SITES.bababou.paths.length);
  assert.equal(reply.status, "PASS");
  assert.equal(reply.cpuMeasured, false);
  assert.ok(reply.results.every(r => r.cache === "HIT"));
});
test("HTTP 402 is platform-blocked; redirects and failures are not PASS", async () => {
  const blocked = await inspect("alban", async () => ({ status: 402, headers: { get: () => "MISS" } }));
  assert.equal(blocked.status, "BLOCKED_PLATFORM");
  const redirected = await inspect("alban", async () => ({ status: 301, headers: { get: () => null } }));
  assert.equal(redirected.status, "WARN");
  assert.ok(redirected.results.every(r => r.state === "REDIRECT"));
  const offline = await inspect("alban", async () => { throw new Error("private diagnostics leak"); });
  assert.equal(offline.status, "WARN");
  assert.doesNotMatch(JSON.stringify(offline), /private diagnostics leak/);
});
test("invalid site cannot trigger a HTTP request", async () => {
  let called = false;
  assert.equal((await inspect("invalid", () => { called = true; })).status, "INVALID");
  assert.equal(called, false);
});
