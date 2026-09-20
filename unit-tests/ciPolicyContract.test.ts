import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowPath = new URL("../.github/workflows/ci-policy.yml", import.meta.url);

test("PR CI policy guard is metadata-only and cannot execute PR code", async () => {
	const workflow = await readFile(workflowPath, "utf8");

	assert.match(workflow, /pull_request_target:/);
	assert.match(workflow, /contents: read/);
	assert.match(workflow, /pull-requests: read/);
	assert.match(workflow, /github\.paginate\(github\.rest\.pulls\.listCommits/);
	assert.match(workflow, /skip ci\|ci skip\|no ci\|skip actions\|actions skip/);
	assert.match(workflow, /skip-checks\\s\*:\\s\*true/);
	assert.doesNotMatch(workflow, /actions\/checkout@/);
	assert.doesNotMatch(workflow, /\bsecrets\./);
	assert.doesNotMatch(workflow, /^\s*run:/m);
});
