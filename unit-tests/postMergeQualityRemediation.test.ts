import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const WORKFLOW = ".github/workflows/post-merge-quality-remediation.yml";

test("post-merge remediation only reacts to a red Quality workflow on master pushes", async () => {
	const workflow = await readFile(WORKFLOW, "utf8");

	assert.match(workflow, /workflow_run:/);
	assert.match(workflow, /CI \(Quality and Security\)/);
	assert.match(workflow, /workflow_run\.event == 'push'/);
	assert.match(workflow, /workflow_run\.head_branch == 'master'/);
	assert.match(workflow, /workflow_run\.conclusion == 'failure'/);
	assert.match(workflow, /workflow_run\.conclusion == 'timed_out'/);
});

test("post-merge remediation keeps write credentials away from formatter hooks", async () => {
	const workflow = await readFile(WORKFLOW, "utf8");

	assert.match(workflow, /persist-credentials: false/);
	assert.match(workflow, /bash scripts\/agent-quality-gate\.sh --fix/);
	assert.match(workflow, /for pass in 1 2 3/);
	assert.match(workflow, /base_ref="\$\{FAILED_SHA\}\^"/);
	assert.match(workflow, /git diff --check/);
	assert.doesNotMatch(workflow, /push origin ["']?master/);
	assert.doesNotMatch(workflow, /refs\/heads\/master/);
});

test("post-merge remediation opens a PR for stable fixes and otherwise an issue", async () => {
	const workflow = await readFile(WORKFLOW, "utf8");

	assert.match(workflow, /pull-requests: write/);
	assert.match(workflow, /issues: write/);
	assert.match(workflow, /contents: write/);
	assert.match(workflow, /automation\/quality-remediation-/);
	assert.match(workflow, /github\.rest\.pulls\.create/);
	assert.match(workflow, /github\.rest\.issues\.create/);
	assert.match(workflow, /post-merge-quality-remediation:/);
});

test("automated remediation PR explicitly dispatches canonical CI", async () => {
	const workflow = await readFile(WORKFLOW, "utf8");

	assert.match(workflow, /actions: write/);
	assert.match(workflow, /github\.rest\.actions\.createWorkflowDispatch/);
	assert.match(workflow, /workflow_id: 'ci\.yml'/);
	assert.match(workflow, /ref: branch/);
});
