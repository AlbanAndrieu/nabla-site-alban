import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
	return readFile(new URL("../" + path, import.meta.url), "utf8");
}

test("PR CI separates the current diff base from the verified production baseline", async () => {
	const ci = await source(".github/workflows/ci.yml");

	assert.doesNotMatch(
		ci,
		/github\.event\.pull_request\.base\.sha/,
		"PR CI must not trust the event-time base SHA for diff baselines",
	);
	assert.match(
		ci,
		/const baseRef = context\.payload\.pull_request\.base\.ref;/,
	);
	assert.match(
		ci,
		/github\.rest\.repos\.getBranch\(\{[\s\S]*?branch: baseRef,[\s\S]*?\}\);/,
	);
	assert.match(ci, /core\.setOutput\('base-sha', baseSha\);/);
	assert.match(
		ci,
		/const productionRef = context\.payload\.repository\.default_branch;/,
	);
	assert.match(
		ci,
		/github\.rest\.repos\.getBranch\(\{[\s\S]*?branch: productionRef,[\s\S]*?\}\);/,
	);
	assert.match(ci, /core\.setOutput\('production-sha', productionSha\);/);

	const resolvedBaseUsages =
		ci.match(/steps\.production-baseline\.outputs\.base-sha/g) ?? [];
	assert.ok(
		resolvedBaseUsages.length >= 4,
		"resolved PR base SHA must be shared by change scope, canonical gate, Semgrep and agent gate",
	);
	assert.match(
		ci,
		/BASE_SHA: \$\{\{ steps\.production-baseline\.outputs\.base-sha \|\| github\.event\.before \|\| github\.sha \}\}/,
	);
	assert.match(
		ci,
		/QUALITY_BASE_REF: \$\{\{ steps\.production-baseline\.outputs\.base-sha \|\| github\.event\.before \|\| 'origin\/master' \}\}/,
	);

	assert.match(
		ci,
		/BASE_SHA: \$\{\{ steps\.production-baseline\.outputs\.production-sha \}\}/,
	);
	assert.match(ci, /id: verified-production-baseline/);
	assert.match(
		ci,
		/PRODUCTION_SHA: \$\{\{ steps\.verified-production-baseline\.outputs\.baseline_sha \}\}/,
	);
	assert.match(
		ci,
		/git show "\$\{PRODUCTION_SHA\}:scripts\/post-deploy-smoke\.mjs"/,
	);
	assert.match(ci, /DEPLOYED_SHA="\$PRODUCTION_SHA" node/);
});
