import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workflow = readFileSync(
	new URL("../.github/workflows/ci-policy.yml", import.meta.url),
	"utf8",
);

test("PR CI policy does not allocate a runner for draft pull requests", () => {
	assert.match(
		workflow,
		/ci-policy:\s*\n\s*(?:#[^\n]*\n\s*)*if: github\.event\.pull_request\.draft == false/,
	);
	assert.match(workflow, /ready_for_review/);
	assert.match(workflow, /pull_request_target:/);
});

test("required non-draft CI policy still scans commit skip directives", () => {
	assert.match(workflow, /github\.paginate\(github\.rest\.pulls\.listCommits/);
	assert.match(workflow, /skipDirective/);
	assert.match(workflow, /core\.setFailed/);
	assert.doesNotMatch(workflow, /actions\/checkout/);
});
