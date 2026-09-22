import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ciUrl = new URL("../.github/workflows/ci.yml", import.meta.url);
const checkpointUrl = new URL(
	"../scripts/publish-vercel-preview-checkpoint.sh",
	import.meta.url,
);

test("Quality automatically publishes exact PR Preview checkpoints after success", async () => {
	const [workflow, checkpointScript] = await Promise.all([
		readFile(ciUrl, "utf8"),
		readFile(checkpointUrl, "utf8"),
	]);

	assert.match(workflow, /preview-security:/);
	assert.match(workflow, /needs: quality/);
	assert.match(workflow, /needs\.quality\.result == 'success'/);
	assert.match(workflow, /needs\.quality\.outputs\.preview_required == 'true'/);
	assert.match(
		workflow,
		/preview_required:\s*\$\{\{ steps\.ci-scope\.outputs\.preview_required \}\}/,
	);
	assert.match(
		workflow,
		/zap_bootstrap:\s*\$\{\{ steps\.ci-scope\.outputs\.zap_bootstrap \}\}/,
	);
	assert.match(workflow, /github\.event\.pull_request\.draft == false/);
	assert.match(
		workflow,
		/github\.event\.pull_request\.head\.repo\.full_name == github\.repository/,
	);
	assert.match(workflow, /contents: write/);
	assert.match(workflow, /pull-requests: read/);
	assert.match(workflow, /statuses: write/);
	assert.match(workflow, /ref: \$\{\{ steps\.preview\.outputs\.sha \}\}/);
	assert.match(workflow, /PR_BASE_SHA/);
	assert.match(workflow, /publish-vercel-preview-checkpoint\.sh/);
	assert.match(checkpointScript, /\^vercel-preview-pr-\[0-9\]\+\$/);
	assert.match(checkpointScript, /git merge-base --is-ancestor/);
	assert.match(checkpointScript, /git ls-remote --exit-code --heads/);
	assert.match(checkpointScript, /--force-with-lease=/);
	assert.match(checkpointScript, /does not reliably emit/);
	assert.match(workflow, /vercel-preview-pr-/);
	assert.match(workflow, /zapBootstrap/);
});

test("automatic Preview delegates deploy classification to the canonical CI scope", async () => {
	const workflow = await readFile(ciUrl, "utf8");

	assert.match(workflow, /needs\.quality\.outputs\.preview_required == 'true'/);
	assert.match(
		workflow,
		/preview_required:\s*\$\{\{ steps\.ci-scope\.outputs\.preview_required \}\}/,
	);
	assert.doesNotMatch(workflow, /const safeOnly/);
	assert.doesNotMatch(workflow, /deployRelevant/);
	assert.doesNotMatch(workflow, /Report maintenance-only Preview skip/);
	assert.doesNotMatch(workflow, /github\.rest\.pulls\.listFiles/);
	assert.match(workflow, /needs\.quality\.outputs\.zap_bootstrap/);
	assert.match(workflow, /Canonical Quality scope requires automatic Preview/);
	assert.doesNotMatch(workflow, /forceCheckpoint/);
});

test("Preview security gate waits for both Playwright and OWASP ZAP exact-SHA statuses", async () => {
	const workflow = await readFile(ciUrl, "utf8");

	assert.match(workflow, /Playwright Preview E2E/);
	assert.match(workflow, /OWASP ZAP Preview/);
	assert.match(workflow, /zap_bootstrap/);
	assert.match(workflow, /ZAP_BOOTSTRAP/);
	assert.match(
		workflow,
		/ZAP_BOOTSTRAP:\s*\$\{\{ needs\.quality\.outputs\.zap_bootstrap \}\}/,
	);
	assert.match(
		workflow,
		/if: needs\.quality\.outputs\.zap_bootstrap == 'true'/,
	);
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
	assert.match(
		workflow,
		/Wait for Vercel, Playwright and ZAP Preview statuses[\s\S]*?retries: 3/,
	);
	assert.doesNotMatch(workflow, /status\?\.state \?\? 'pending'/);
	assert.match(workflow, /Timed out waiting for/);
});
