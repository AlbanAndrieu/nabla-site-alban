import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowPath = new URL(
	"../.github/workflows/release.yml",
	import.meta.url,
);

test("semantic-release bootstrap creates the baseline through the Git References API", async () => {
	const workflow = await readFile(workflowPath, "utf8");

	assert.match(workflow, /RELEASE_CONFIG_COMMIT=/);
	assert.match(
		workflow,
		/BASELINE_SHA="\$\(git rev-parse "\$\{RELEASE_CONFIG_COMMIT\}\^"\)"/,
	);
	assert.match(workflow, /git tag v0\.0\.0 "\$\{BASELINE_SHA\}"/);
	assert.match(workflow, /gh api --method POST/);
	assert.match(workflow, /repos\/\$\{GITHUB_REPOSITORY\}\/git\/refs/);
	assert.doesNotMatch(workflow, /git push origin refs\/tags\/v0\.0\.0/);
	assert.doesNotMatch(workflow, /git diff-tree/);
});

test("semantic-release keeps the release token least-privileged", async () => {
	const workflow = await readFile(workflowPath, "utf8");

	assert.doesNotMatch(workflow, /permission-workflows:/);
	assert.doesNotMatch(workflow, /^\s*workflows:\s*write\s*$/m);
	assert.match(workflow, /^\s*contents:\s*write\s*$/m);
});
