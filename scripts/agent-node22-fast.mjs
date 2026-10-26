#!/usr/bin/env node
/** Offline L1 smoke: Node 22/npm 10 (agent) or Node 24/npm 12 (project). NOT a publish gate. */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const FAST_TESTS = Object.freeze([
  "unit-tests/homelabIconFallback.test.mjs",
  "unit-tests/agentNode22Core.test.mjs",
  "unit-tests/agentNode22Fast.test.mjs",
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
      (nodeMajor === 22 && (nodeMinor > 16 || (nodeMinor === 16 && nodePatch >= 0))) ||
      (nodeMajor === 24 && (nodeMinor > 22 || (nodeMinor === 22 && nodePatch >= 1)))
    )
  ) return "BLOCKED_NODE_RUNTIME: Node >=22.16 <23 or >=24.22.1 <25 required";
  if (!npm || Number(npm[1]) !== (nodeMajor === 22 ? 10 : 12) ||
      (nodeMajor === 24 && (Number(npm[2]) < 2 ||
        (Number(npm[2]) === 2 && Number(npm[3]) < 0))))
    return "BLOCKED_NPM_RUNTIME: use npm 10 with Node 22 or npm >=12.2 <13 with Node 24";
  return null;
}

export function missingSources(root, tests = FAST_TESTS) {
  return tests.filter((path) => !existsSync(resolve(root, path)));
}

export function runNode22Fast({ argv = process.argv.slice(2), root = resolve(dirname(fileURLToPath(import.meta.url)), "..") } = {}) {
  if (argv.length > 1 || (argv.length === 1 && argv[0] !== "--preflight")) {
    console.error("usage: node scripts/agent-node22-fast.mjs [--preflight]");
    return 2;
  }
  const npm = spawnSync("npm", ["--version"], { encoding: "utf8", timeout: 8_000 });
  if (npm.error || npm.status !== 0) {
    console.error("BLOCKED_NPM_RUNTIME: npm --version not available");
    return 2;
  }
  const problem = checkFastToolchain(process.version, npm.stdout.trim());
  if (problem) {
    console.error(problem + " (observed " + process.version + " / npm " + npm.stdout.trim() + ")");
    return 2;
  }
  console.log("LOCAL_FAST_TOOLCHAIN_OK: " + process.version + " / npm " + npm.stdout.trim());
  const missing = missingSources(root);
  if (missing.length) {
    console.error("BLOCKED_INCOMPLETE_CHECKOUT: " + missing.join(", "));
    return 3;
  }
  if (argv[0] === "--preflight") return 0;
  const result = spawnSync(process.execPath, [
    "--experimental-strip-types", "--test", "--test-concurrency=2", ...FAST_TESTS,
  ], { cwd: root, stdio: "inherit", timeout: 120_000 });
  if (result.error || result.signal) {
    console.error("LOCAL_FAST_RUNNER_FAILED: " + (result.error?.message ?? result.signal));
    return 1;
  }
  if (result.status !== 0) {
    console.error("LOCAL_FAST_TEST_FAIL: exit=" + result.status);
    return 1;
  }
  console.log("LOCAL_FAST_L1_PASS: dependency-free tests only; full publication gate NOT_RUN");
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = runNode22Fast();
}
