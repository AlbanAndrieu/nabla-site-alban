import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const WORKFLOW = ".github/workflows/post-merge-quality-remediation.yml";
const CI_WORKFLOW = ".github/workflows/ci.yml";
const AGENT_RULES = "AGENTS.md";

test("post-merge remediation only reacts to a red Quality workflow on master pushes", async () => {
	const workflow = await readFile(WORKFLOW, "utf8");

	assert.match(workflow, /workflow_run:/);
	assert.match(workflow, /CI \(Quality and Security\)/);
	assert.match(workflow, /branches:\n\s+- master/);
	assert.match(workflow, /workflow_run\.event == 'push'/);
	assert.match(workflow, /workflow_run\.head_branch == 'master'/);
	assert.match(workflow, /workflow_run\.conclusion == 'failure'/);
	assert.match(workflow, /workflow_run\.conclusion == 'timed_out'/);
});

test("post-merge remediation isolates untrusted auto-fix work from write permissions", async () => {
	const workflow = await readFile(WORKFLOW, "utf8");
	const publishMarker = "\n  publish:\n";
	const publishIndex = workflow.indexOf(publishMarker);

	assert.notEqual(publishIndex, -1);
	const prepare = workflow.slice(0, publishIndex);
	const publish = workflow.slice(publishIndex);

	assert.match(workflow, /permissions:\n  contents: read/);
	assert.match(prepare, /persist-credentials: false/);
	assert.match(prepare, /bash scripts\/agent-quality-gate\.sh --fix/);
	assert.match(prepare, /for pass in 1 2 3/);
	assert.match(prepare, /workspace_fingerprint/);
	assert.match(prepare, /--untracked-files=all/);
	assert.match(prepare, /base_ref="\$\{FAILED_SHA\}\^"/);
	assert.doesNotMatch(prepare, /contents: write/);
	assert.doesNotMatch(prepare, /issues: write/);
	assert.doesNotMatch(prepare, /pull-requests: write/);
	assert.doesNotMatch(prepare, /actions: write/);

	assert.match(publish, /actions: write/);
	assert.match(publish, /contents: write/);
	assert.match(publish, /issues: write/);
	assert.match(publish, /pull-requests: write/);
	assert.match(publish, /git apply --binary --index remediation\.patch/);
	assert.match(publish, /git diff --cached --check/);
	assert.doesNotMatch(workflow, /push origin ["']?master/);
	assert.doesNotMatch(workflow, /refs\/heads\/master/);
});

test("post-merge remediation transports only the deterministic patch across the privilege boundary", async () => {
	const workflow = await readFile(WORKFLOW, "utf8");

	assert.match(workflow, /git diff --cached --binary --full-index >remediation\.patch/);
	assert.match(workflow, /actions\/upload-artifact@b7c566a772e6b6bfb58ed0dc250532a479d7789f/);
	assert.match(workflow, /actions\/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c/);
});

test("post-merge remediation opens a PR for stable fixes and otherwise a deduplicated issue", async () => {
	const workflow = await readFile(WORKFLOW, "utf8");

	assert.match(workflow, /automation\/quality-remediation-/);
	assert.match(workflow, /github\.rest\.pulls\.create/);
	assert.match(workflow, /github\.rest\.issues\.create/);
	assert.match(workflow, /post-merge-quality-remediation:/);
	assert.match(workflow, /github\.paginate\(github\.rest\.issues\.listForRepo/);
	assert.match(workflow, /unable to open remediation PR/);
	assert.match(workflow, /canonical CI dispatch failed/);
	assert.match(workflow, /Automation fallback/);
});

test("automated remediation PR explicitly dispatches canonical CI", async () => {
	const workflow = await readFile(WORKFLOW, "utf8");

	assert.match(workflow, /github\.rest\.actions\.createWorkflowDispatch/);
	assert.match(workflow, /workflow_id: 'ci\.yml'/);
	assert.match(workflow, /ref: branch/);
});

test("changes to the post-merge remediation workflow are themselves quality-gated", async () => {
	const ci = await readFile(CI_WORKFLOW, "utf8");
	const occurrences = ci.match(
		/\.github\/workflows\/post-merge-quality-remediation\.yml/g,
	);

	assert.equal(occurrences?.length, 2);
});

test("agent policy documents post-merge remediation as recovery-only", async () => {
	const rules = await readFile(AGENT_RULES, "utf8");

	assert.match(rules, /Post-merge remediation is recovery only/);
	assert.match(rules, /workflow file exists on the default branch/);
	assert.match(rules, /must never rely on this post-merge workflow/);
});
