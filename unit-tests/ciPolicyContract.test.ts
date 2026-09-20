import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowPath = new URL("../.github/workflows/ci-policy.yml", import.meta.url);
const canonicalCiPath = new URL("../.github/workflows/ci.yml", import.meta.url);

test("PR CI policy guard is metadata-only and cannot execute PR code", async () => {
	const [workflow, canonicalCi] = await Promise.all([
		readFile(workflowPath, "utf8"),
		readFile(canonicalCiPath, "utf8"),
	]);

	assert.match(workflow, /pull_request_target:/);
	assert.match(workflow, /contents: read/);
	assert.match(workflow, /pull-requests: read/);
	assert.match(workflow, /github\.paginate\(github\.rest\.pulls\.listCommits/);
	assert.match(workflow, /skip ci\|ci skip\|no ci\|skip actions\|actions skip/);
	assert.match(workflow, /skip-checks\\s\*:\\s\*true/);
	assert.doesNotMatch(workflow, /actions\/checkout@/);
	assert.doesNotMatch(workflow, /\bsecrets\./);
	assert.doesNotMatch(workflow, /^\s*run:/m);

	const policyScopeMatches = canonicalCi.match(
		/"\.github\/workflows\/ci-policy\.yml"/g,
	);
	assert.equal(
		policyScopeMatches?.length,
		2,
		"canonical CI must include ci-policy.yml for PR and master push scopes",
	);
});
