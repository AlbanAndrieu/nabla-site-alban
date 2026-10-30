import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
	checkFastToolchain,
	FAST_TESTS,
	missingSources,
	summarizeFastTestOutput,
} from "../scripts/agent-node22-fast.mjs";

test("fast profile accepts agent Node22/npm10 and project Node24/npm12", () => {
	assert.equal(checkFastToolchain("v22.16.0", "10.9.2"), null);
	assert.equal(checkFastToolchain("v22.17.1", "10.9.3"), null);
	assert.equal(checkFastToolchain("v24.22.1", "12.2.0"), null);
	assert.equal(checkFastToolchain("v24.23.0", "12.3.1"), null);
	assert.match(
		checkFastToolchain("v22.15.0", "10.9.2"),
		/BLOCKED_NODE_RUNTIME/,
	);
	assert.match(
		checkFastToolchain("v24.22.0", "12.2.0"),
		/BLOCKED_NODE_RUNTIME/,
	);
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
	assert.ok(FAST_TESTS.includes("unit-tests/agentTaskContext.test.mjs"));
	assert.ok(FAST_TESTS.includes("unit-tests/homelabIconFallback.test.mjs"));
	assert.ok(
		FAST_TESTS.every((path) =>
			/^unit-tests\/[a-zA-Z0-9]+\.test\.mjs$/.test(path),
		),
	);
});

test("missing files fail closed rather than producing a partial PASS", () => {
	assert.deepEqual(
		missingSources("/directory-that-does-not-exist", [
			"unit-tests/missing.test.mjs",
		]),
		["unit-tests/missing.test.mjs"],
	);
	assert.deepEqual(
		missingSources(new URL("..", import.meta.url).pathname, [
			"unit-tests/agentNode22Fast.test.mjs",
		]),
		[],
	);
});

test("profile does not install packages, rebuild Next.js or bypass publication checks", () => {
	const code = readFileSync(
		new URL("../scripts/agent-node22-fast.mjs", import.meta.url),
		"utf8",
	);
	assert.doesNotMatch(code, /spawnSync\("(?:npm|npx)", \["(?:ci|install|run)"/);
	assert.doesNotMatch(code, /\["--no-verify"\]|\["--force"\]/);
	assert.match(code, /LOCAL_FAST_L1_PASS/);
	assert.match(code, /BLOCKED_INCOMPLETE_CHECKOUT/);
});

test("L1 compact output retains counts, failing names and source locations", () => {
	const output = [
		"✔ passing service (1.01ms)",
		"✖ invalid SERVICE cache (4.25ms)",
		"ℹ tests 3",
		"ℹ pass 2",
		"ℹ fail 1",
		"ℹ duration_ms 9145.9",
		"✖ failing tests:",
		"test at unit-tests/homelabEffectHydration.test.mjs:10:1",
		"✖ invalid SERVICE cache (4.25ms)",
		"  AssertionError [ERR_ASSERTION]: The input did not match",
		"  actual: [very large source file omitted]",
	].join("\n");
	const result = summarizeFastTestOutput(output, 1);
	assert.equal(result.headline, "❌ L1: 2/3 PASS · 1 FAIL (9.1s)");
	assert.deepEqual(result.failures, [
		{
			name: "invalid SERVICE cache",
			location: "unit-tests/homelabEffectHydration.test.mjs:10",
		},
	]);
	assert.doesNotMatch(result.headline, /actual|AssertionError/);
	assert.equal(
		summarizeFastTestOutput(
			"ℹ tests 79\nℹ pass 79\nℹ fail 0\nℹ duration_ms 9136",
			0,
		).headline,
		"✅ L1: 79/79 tests PASS (9.1s)",
	);
});

test("L1 failure summary cannot report success for a runner crash", () => {
	const result = summarizeFastTestOutput("SyntaxError: unexpected token", 1);
	assert.match(result.headline, /❌ L1/);
	assert.equal(result.failures.length, 0);
});

test("L1 retains the full private test log outside the source tree", () => {
	const source = readFileSync(
		new URL("../scripts/agent-node22-fast.mjs", import.meta.url),
		"utf8",
	);
	assert.match(
		source,
		/git",\s*\["rev-parse", "--git-path", "agent-fast-tests\.log"\]/,
	);
	assert.match(
		source,
		/writeFileSync\(logPath, stdout \+ stderr, \{ mode: 0o600 \}\)/,
	);
	assert.match(source, /QUALITY_VERBOSE/);
});

test("L1 rejects an empty or inconsistent report even when Node exits zero", () => {
	const missing = summarizeFastTestOutput("", 0);
	assert.equal(missing.valid, false);
	assert.match(missing.headline, /❌ L1/);

	const mismatched = summarizeFastTestOutput(
		"ℹ tests 79\nℹ pass 75\nℹ fail 0",
		0,
	);
	assert.equal(mismatched.valid, false);
	assert.match(mismatched.headline, /❌ L1/);

	const proper = summarizeFastTestOutput("ℹ tests 79\nℹ pass 79\nℹ fail 0", 0);
	assert.equal(proper.valid, true);
	assert.match(proper.headline, /✅ L1/);
});
