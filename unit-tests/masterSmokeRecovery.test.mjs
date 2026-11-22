import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
	chmodSync,
	mkdtempSync,
	mkdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const SCRIPT = new URL("../scripts/verify-master-baseline.sh", import.meta.url).pathname;
const RECOVERY_SHA = "1259c593927ed99aa7c2f68691ce1829480f0dfe";
const RUN_URL = "https://github.com/AlbanAndrieu/nabla-site-alban/actions/runs/44905557576";

function run(statuses, sha = RECOVERY_SHA, repo = "AlbanAndrieu/nabla-site-alban") {
	const dir = mkdtempSync(join(tmpdir(), "smoke-baseline-recovery-"));
	const bin = join(dir, "bin");
	const curl = join(bin, "curl");
	const output = join(dir, "github-output");
	try {
		mkdirSync(bin);
		const init = spawnSync("git", ["init", "-q", dir], { encoding: "utf8" });
		assert.equal(init.status, 0, init.stderr);
		writeFileSync(curl, '#!/bin/sh\ncat <<\'STATUSES\'\n' + JSON.stringify({ statuses }) + '\nSTATUSES\n');
		chmodSync(curl, 0o755);
		const result = spawnSync("bash", [SCRIPT], {
			cwd: dir,
			encoding: "utf8",
			env: {
				...process.env,
				PATH: bin + ":" + process.env.PATH,
				BASE_SHA: sha,
				GH_TOKEN: "mock",
				GITHUB_REPOSITORY: repo,
				GITHUB_OUTPUT: output,
			},
		});
		let outputs = "";
		try {
			outputs = readFileSync(output, "utf8");
		} catch {
			// Failed checks must not populate GitHub step outputs.
		}
		return { ...result, outputs };
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}

const status = (context, state, target_url = "") => ({
	context, state, target_url, created_at: "2026-11-21T12:46:37Z",
});
const vercel = status("Vercel", "success");
const smoke = status("Production Post-deploy Smoke", "failure", RUN_URL);

test("known master ESM checkout incident requires independent production recheck", () => {
	const result = run([vercel, smoke]);
	assert.equal(result.status, 0, result.stderr);
	assert.match(result.stderr, /PROD_BASE_SMOKE_REPAIR_REQUIRED/);
	assert.match(result.outputs, new RegExp("baseline_sha=" + RECOVERY_SHA));
	assert.match(result.outputs, /smoke_recovery=module-import/);
	assert.doesNotMatch(result.stderr, /production baseline healthy/);
});

test("smoke recovery refuses unknown incidents, other repositories and DAST failures", () => {
	const cases = [
		[
			[vercel, status("Production Post-deploy Smoke", "failure", RUN_URL + "-other")],
			RECOVERY_SHA,
			"AlbanAndrieu/nabla-site-alban",
		],
		[[vercel, smoke], "f".repeat(40), "AlbanAndrieu/nabla-site-alban"],
		[[vercel, smoke], RECOVERY_SHA, "other/repo"],
		[
			[vercel, smoke, status("Production DAST", "failure")],
			RECOVERY_SHA,
			"AlbanAndrieu/nabla-site-alban",
		],
		[
			[status("Vercel", "failure"), smoke],
			RECOVERY_SHA,
			"AlbanAndrieu/nabla-site-alban",
		],
	];
	for (const [statuses, sha, repo] of cases) {
		const result = run(statuses, sha, repo);
		assert.equal(result.status, 1, result.stderr);
		assert.match(result.stderr, /PROD_BASE_UNHEALTHY/);
		assert.equal(result.outputs, "");
	}
});

test("CI repair must independently execute deployed smoke logic, never re-label an old status", async () => {
	const { readFile } = await import("node:fs/promises");
	const ci = await readFile(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");
	const baseline = await readFile(new URL("../scripts/verify-master-baseline.sh", import.meta.url), "utf8");
	for (const needle of [
		'git show "${PRODUCTION_SHA}:scripts/post-deploy-smoke.mjs"',
		'git show "${PRODUCTION_SHA}:scripts/lib/production-smoke-html.mjs"',
		'DEPLOYED_SHA="$PRODUCTION_SHA" node "$baseline_smoke" "$BASE_URL"',
		'PROD_BASE_SMOKE_RECHECK_FAILED',
		'git diff --quiet "$PRODUCTION_SHA" "$HEAD_SHA" -- scripts/post-deploy-smoke.mjs scripts/lib/production-smoke-html.mjs',
		'scripts/lib/production-smoke-html.mjs',
	]) assert.ok(ci.includes(needle), "missing recheck: " + needle);
	assert.match(baseline, /PROD_BASE_SMOKE_REPAIR_REQUIRED/);
	assert.doesNotMatch(ci, /continue-on-error:\s*true[\s\S]{0,300}Revalidate canonical production smoke before PR build/);
});
