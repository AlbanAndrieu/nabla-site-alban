import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { checkFastToolchain, FAST_TESTS, missingSources } from "../scripts/agent-node22-fast.mjs";

test("fast profile accepts agent Node22/npm10 and project Node24/npm12", () => {
  assert.equal(checkFastToolchain("v22.16.0", "10.9.2"), null);
  assert.equal(checkFastToolchain("v22.17.1", "10.9.3"), null);
  assert.equal(checkFastToolchain("v24.22.1", "12.2.0"), null);
  assert.equal(checkFastToolchain("v24.23.0", "12.3.1"), null);
  assert.match(checkFastToolchain("v22.15.0", "10.9.2"), /BLOCKED_NODE_RUNTIME/);
  assert.match(checkFastToolchain("v24.22.0", "12.2.0"), /BLOCKED_NODE_RUNTIME/);
  assert.match(checkFastToolchain("v23.0.0", "10.9.2"), /BLOCKED_NODE_RUNTIME/);
  assert.match(checkFastToolchain("v26.0.0", "12.2.0"), /BLOCKED_NODE_RUNTIME/);
  assert.match(checkFastToolchain("v24.22.1", "10.9.2"), /BLOCKED_NPM_RUNTIME/);
  assert.match(checkFastToolchain("v22.16.0", "12.2.0"), /BLOCKED_NPM_RUNTIME/);
  assert.match(checkFastToolchain("v24.22.1", "12.1.9"), /BLOCKED_NPM_RUNTIME/);
  assert.match(checkFastToolchain("invalid", "10.9.2"), /BLOCKED_NODE_RUNTIME/);
});

test("fast profile stays a bounded dependency-free contract suite", () => {
  assert.equal(new Set(FAST_TESTS).size, FAST_TESTS.length);
  assert.ok(FAST_TESTS.includes("unit-tests/agentNode22Core.test.mjs"));
  assert.ok(FAST_TESTS.includes("unit-tests/homelabIconFallback.test.mjs"));
  assert.ok(FAST_TESTS.every((path) => /^unit-tests\/[a-zA-Z0-9]+\.test\.mjs$/.test(path)));
});

test("missing files fail closed rather than producing a partial PASS", () => {
  assert.deepEqual(missingSources("/directory-that-does-not-exist", ["unit-tests/missing.test.mjs"]), ["unit-tests/missing.test.mjs"]);
  assert.deepEqual(missingSources(new URL("..", import.meta.url).pathname, ["unit-tests/agentNode22Fast.test.mjs"]), []);
});

test("profile does not install packages, rebuild Next.js or bypass publication checks", () => {
  const code = readFileSync(new URL("../scripts/agent-node22-fast.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(code, /spawnSync\("(?:npm|npx)", \["(?:ci|install|run)"/);
  assert.doesNotMatch(code, /\["--no-verify"\]|\["--force"\]/);
  assert.match(code, /LOCAL_FAST_L1_PASS/);
  assert.match(code, /BLOCKED_INCOMPLETE_CHECKOUT/);
});
