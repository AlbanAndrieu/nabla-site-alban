#!/usr/bin/env node
/** Offline L1 smoke: Node 22/npm 10 (agent) or Node 24/npm 12 (project). NOT a publish gate. */
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const FAST_TESTS = Object.freeze([
	"unit-tests/homelabIconFallback.test.mjs",
	"unit-tests/agentNode22Core.test.mjs",
	"unit-tests/agentNode22Fast.test.mjs",
	"unit-tests/agentTaskContext.test.mjs",
	"unit-tests/agentSkillParity.test.mjs",
	"unit-tests/homelabCanonicalEvidence.test.mjs",
	"unit-tests/homelabCatalogFailureReconciliation.test.mjs",
	"unit-tests/homelabOwnerHttpEvidence.test.mjs",
	"unit-tests/homelabTraceContext.test.mjs",
	"unit-tests/homelabAuditPolicy.test.mjs",
	"unit-tests/homelabAuditFlow.test.mjs",
	"unit-tests/homelab429Triage.test.mjs",
	"unit-tests/homelabHookParse.test.mjs",
	"unit-tests/nextRouteTypegen.test.mjs",
	"unit-tests/homelabTraceEchoContract.test.mjs",
	"unit-tests/homelabGraphPerformanceContracts.test.mjs",
	"unit-tests/homelabOwnerTracePresentation.test.mjs",
	"unit-tests/homelabCardLayoutStability.test.mjs",
	"unit-tests/homelabRecheckLayout.test.mjs",
	"unit-tests/homelabSlowApiResilience.test.mjs",
	"unit-tests/homelabEffectHydration.test.mjs",
	"unit-tests/homelabResourceImportIntegration.test.mjs",
	"unit-tests/homelabConcisePresentation.test.mjs",
	"unit-tests/vercelIgnoreBuild.test.mjs",
]);

export function checkFastToolchain(nodeVersion, npmVersion) {
	const node = /^v(\d+)\.(\d+)\.(\d+)$/.exec(nodeVersion);
	const npm = /^(\d+)\.(\d+)\.(\d+)$/.exec(npmVersion);
	const nodeMajor = node ? Number(node[1]) : 0;
	const nodeMinor = node ? Number(node[2]) : 0;
	const nodePatch = node ? Number(node[3]) : 0;
	if (
		!node ||
		!(
			(nodeMajor === 22 &&
				(nodeMinor > 16 || (nodeMinor === 16 && nodePatch >= 0))) ||
			(nodeMajor === 24 &&
				(nodeMinor > 22 || (nodeMinor === 22 && nodePatch >= 1)))
		)
	)
		return "BLOCKED_NODE_RUNTIME: Node >=22.16 <23 or >=24.22.1 <25 required";
	if (
		!npm ||
		Number(npm[1]) !== (nodeMajor === 22 ? 10 : 12) ||
		(nodeMajor === 24 &&
			(Number(npm[2]) < 2 || (Number(npm[2]) === 2 && Number(npm[3]) < 0)))
	)
		return "BLOCKED_NPM_RUNTIME: use npm 10 with Node 22 or npm >=12.2 <13 with Node 24";
	return null;
}

export function missingSources(root, tests = FAST_TESTS) {
	return tests.filter((path) => !existsSync(resolve(root, path)));
}

/** Format Node's spec report without embedding complete source files in failures. */
export function summarizeFastTestOutput(output, exitCode) {
	const stats = Object.fromEntries(
		[...output.matchAll(/^ℹ (tests|pass|fail|duration_ms) ([\d.]+)$/gm)].map(
			(match) => [match[1], Number(match[2])],
		),
	);
	const failures = [
		...output.matchAll(/^test at ([^\n]+?):(\d+):\d+\r?\n✖ ([^\n]+)/gm),
	].map((match) => ({
		location: `${match[1]}:${match[2]}`,
		name: match[3].replace(/ \([\d.]+ms\)$/, "").trim(),
	}));
	if (exitCode !== 0 && failures.length === 0) {
		const names = [...output.matchAll(/^✖ (?!failing tests:)([^\n]+)/gm)];
		for (const match of names) {
			const name = match[1].replace(/ \([\d.]+ms\)$/, "").trim();
			if (!failures.some((item) => item.name === name))
				failures.push({ name, location: "unknown" });
		}
	}
	const valid =
		Number.isInteger(stats.tests) &&
		stats.tests > 0 &&
		Number.isInteger(stats.pass) &&
		stats.pass >= 0 &&
		Number.isInteger(stats.fail) &&
		stats.fail >= 0 &&
		stats.tests === stats.pass + stats.fail;
	const total = stats.tests ?? "?";
	const passed = stats.pass ?? "?";
	const failed = stats.fail ?? (exitCode === 0 ? 0 : failures.length);
	const duration = Number.isFinite(stats.duration_ms)
		? ` (${(stats.duration_ms / 1000).toFixed(1)}s)`
		: "";
	const headline =
		exitCode === 0 && valid && failed === 0
			? `✅ L1: ${passed}/${total} tests PASS${duration}`
			: `❌ L1: ${passed}/${total} PASS · ${failed} FAIL${duration}`;
	return { headline, failures, valid };
}

export function runNode22Fast({
	argv = process.argv.slice(2),
	root = resolve(dirname(fileURLToPath(import.meta.url)), ".."),
} = {}) {
	if (argv.length > 1 || (argv.length === 1 && argv[0] !== "--preflight")) {
		console.error("usage: node scripts/agent-node22-fast.mjs [--preflight]");
		return 2;
	}
	const npm = spawnSync("npm", ["--version"], {
		encoding: "utf8",
		timeout: 8_000,
	});
	if (npm.error || npm.status !== 0) {
		console.error("BLOCKED_NPM_RUNTIME: npm --version not available");
		return 2;
	}
	const problem = checkFastToolchain(process.version, npm.stdout.trim());
	if (problem) {
		console.error(
			problem +
				" (observed " +
				process.version +
				" / npm " +
				npm.stdout.trim() +
				")",
		);
		return 2;
	}
	console.log(
		"LOCAL_FAST_TOOLCHAIN_OK: " +
			process.version +
			" / npm " +
			npm.stdout.trim(),
	);
	const missing = missingSources(root);
	if (missing.length) {
		console.error("BLOCKED_INCOMPLETE_CHECKOUT: " + missing.join(", "));
		return 3;
	}
	if (argv[0] === "--preflight") return 0;
	const pathResult = spawnSync(
		"git",
		["rev-parse", "--git-path", "agent-fast-tests.log"],
		{
			cwd: root,
			encoding: "utf8",
			timeout: 8_000,
		},
	);
	if (pathResult.status !== 0 || !pathResult.stdout?.trim()) {
		console.error("LOCAL_FAST_LOG_PATH_FAILED: Git metadata unavailable");
		return 2;
	}
	const logPath = resolve(root, pathResult.stdout.trim());
	const result = spawnSync(
		process.execPath,
		[
			"--experimental-strip-types",
			"--test",
			"--test-reporter=spec",
			"--test-concurrency=2",
			...FAST_TESTS,
		],
		{
			cwd: root,
			encoding: "utf8",
			maxBuffer: 32 * 1024 * 1024,
			timeout: 120_000,
		},
	);
	const stdout = result.stdout ?? "";
	const stderr = result.stderr ?? "";
	try {
		writeFileSync(logPath, stdout + stderr, { mode: 0o600 });
		chmodSync(logPath, 0o600);
	} catch (error) {
		console.error("LOCAL_FAST_LOG_WRITE_FAILED: " + error.message);
		return 1;
	}
	if (process.env.QUALITY_VERBOSE === "1") {
		process.stdout.write(stdout);
		process.stderr.write(stderr);
	}
	const summary = summarizeFastTestOutput(stdout, result.status);
	console.log(summary.headline);
	if (result.error || result.signal) {
		console.error(
			"LOCAL_FAST_RUNNER_FAILED: " + (result.error?.message ?? result.signal),
		);
	}
	if (!summary.valid || result.status !== 0 || result.error || result.signal) {
		for (const failure of summary.failures.slice(0, 20)) {
			console.error(`  ✖ ${failure.name} — ${failure.location}`);
		}
		if (!summary.valid)
			console.error(
				"LOCAL_FAST_INVALID_REPORT: missing or inconsistent test totals",
			);
		if (!summary.failures.length) {
			const detail = (stderr || stdout)
				.trim()
				.split("\n")
				.slice(-8)
				.map((line) => line.slice(0, 180))
				.join("\n");
			console.error(detail || "Test runner exited without diagnostic output.");
		}
		console.error("LOCAL_FAST_TEST_FAIL: full log " + logPath);
		console.error("Tip: QUALITY_VERBOSE=1 npm run test:fast:local");
		return 1;
	}
	console.log("LOCAL_FAST_L1_PASS: full publication gate NOT_RUN");
	return 0;
}

if (
	process.argv[1] &&
	resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
	process.exitCode = runNode22Fast();
}
