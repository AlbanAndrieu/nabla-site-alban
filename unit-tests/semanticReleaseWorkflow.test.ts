import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowPath = new URL(
	"../.github/workflows/release.yml",
	import.meta.url,
);

test("semantic-release bootstrap avoids workflow-changing tag targets", async () => {
	const workflow = await readFile(workflowPath, "utf8");

	assert.match(workflow, /RELEASE_CONFIG_COMMIT=/);
	assert.match(
		workflow,
		/git diff-tree --root -m --no-commit-id --name-only -r/,
	);
	assert.match(workflow, /-- \.github\/workflows \| grep -q \./);
	assert.match(workflow, /Skipping workflow-changing baseline candidate/);
	assert.match(workflow, /git rev-parse "\$\{BASELINE_SHA\}\^"/);
	assert.match(workflow, /git tag v0\.0\.0 "\$\{BASELINE_SHA\}"/);
});

test("semantic-release keeps the release token least-privileged", async () => {
	const workflow = await readFile(workflowPath, "utf8");

	assert.doesNotMatch(workflow, /permission-workflows:/);
	assert.doesNotMatch(workflow, /^\s*workflows:\s*write\s*$/m);
	assert.match(workflow, /^\s*contents:\s*write\s*$/m);
});
