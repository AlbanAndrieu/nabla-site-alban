import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ciUrl = new URL("../.github/workflows/ci.yml", import.meta.url);

test("Quality automatically publishes exact PR Preview checkpoints after success", async () => {
	const workflow = await readFile(ciUrl, "utf8");

	assert.match(workflow, /preview-security:/);
	assert.match(workflow, /needs: quality/);
	assert.match(workflow, /needs\.quality\.result == 'success'/);
	assert.match(workflow, /github\.event\.pull_request\.draft == false/);
	assert.match(
		workflow,
		/github\.event\.pull_request\.head\.repo\.full_name == github\.repository/,
	);
	assert.match(workflow, /contents: write/);
	assert.match(workflow, /pull-requests: read/);
	assert.match(workflow, /statuses: write/);
	assert.match(workflow, /ref: \$\{\{ steps\.preview\.outputs\.sha \}\}/);
	assert.match(
		workflow,
		/git push --force origin "HEAD:refs\/heads\/\$\{CHECKPOINT_BRANCH\}"/,
	);
	assert.match(workflow, /vercel-preview-pr-/);
	assert.match(workflow, /zapBootstrap/);
});

test("automatic Preview policy skips repository-security maintenance without hiding deploy-relevant app changes", async () => {
	const workflow = await readFile(ciUrl, "utf8");

	assert.match(workflow, /filename\.startsWith\('docs\/'\)/);
	assert.match(workflow, /filename\.startsWith\('unit-tests\/'\)/);
	assert.match(workflow, /filename\.startsWith\('\.github\/'\)/);
	assert.match(workflow, /filename\.startsWith\('\.zap\/'\)/);
	assert.doesNotMatch(workflow, /forceCheckpoint/);
	assert.match(workflow, /No deploy-relevant files/);
	assert.match(workflow, /deployRelevant/);
});

test("Preview security gate waits for both Playwright and OWASP ZAP exact-SHA statuses", async () => {
	const workflow = await readFile(ciUrl, "utf8");

	assert.match(workflow, /Playwright Preview E2E/);
	assert.match(workflow, /OWASP ZAP Preview/);
	assert.match(workflow, /zap_bootstrap/);
	assert.match(workflow, /ZAP_BOOTSTRAP/);
	assert.match(
		workflow,
		/repository_dispatch uses the default-branch workflow/,
	);
	assert.match(workflow, /stale master ZAP result/);
	assert.match(workflow, /Publish deferred ZAP workflow-bootstrap status/);
	assert.match(workflow, /createCommitStatus/);
	assert.match(workflow, /Deferred: ZAP workflow bootstrap; Playwright passed/);
	assert.match(workflow, /statuses: write/);
	assert.match(workflow, /listCommitStatusesForRef/);
	assert.match(workflow, /STATUS_SHA/);
	assert.match(workflow, /PR_NUMBER/);
	assert.match(workflow, /livePr\.head\.sha !== sha/);
	assert.match(workflow, /stop waiting on stale Preview statuses/);
	assert.match(workflow, /state === 'success'/);
	assert.match(workflow, /failure', 'error/);
	assert.match(workflow, /vercelRegistrationDeadline/);
	assert.match(workflow, /2 \* 60 \* 1000/);
	assert.match(workflow, /status\?\.state \?\? 'absent'/);
	assert.match(workflow, /Vercel status was not registered within 2 minutes/);
	assert.doesNotMatch(workflow, /status\?\.state \?\? 'pending'/);
	assert.match(workflow, /Timed out waiting for/);
});
