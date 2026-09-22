import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) =>
	readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("agent quality keeps TypeScript and unit coverage while scoping route type generation", async () => {
	const gate = await read("scripts/agent-quality-gate.sh");

	assert.match(gate, /bash scripts\/ci-scope\.sh/);
	assert.match(gate, /case "\$\{build\}" in/);
	assert.match(gate, /run_maintenance_project_checks/);
	assert.match(gate, /maintenance lint, CSS, TypeScript and unit gate/);
	assert.match(
		gate,
		/npm run lint\n\s+npm run lint:css\n\s+npm run typecheck\n\s+npm run test:unit/,
	);
	assert.match(gate, /run_full_prebuild_checks/);
	assert.match(gate, /npx next typegen/);
	assert.match(gate, /full pre-build lint, route types, TypeScript and unit gate/);
});

test("publication proof builds deploy-relevant changes only after strict agent validation", async () => {
	const publish = await read("scripts/agent-publish.sh");

	const gate = publish.indexOf("agent-quality-gate.sh --publish");
	const scope = publish.indexOf("bash scripts/ci-scope.sh", gate);
	const build = publish.indexOf("npm run build", scope);
	const proofWritten = publish.indexOf("QG_PUBLISH_PROOF_WRITTEN", build);

	assert.ok(gate >= 0);
	assert.ok(scope > gate);
	assert.ok(build > scope);
	assert.ok(proofWritten > build);
	assert.match(publish, /case "\$\{build\}" in/);
	assert.match(
		publish,
		/Next build intentionally skipped for non-deployable publication scope/,
	);
	assert.match(publish, /QG_PUBLISH_SCOPE_INVALID/);
	assert.match(publish, /QG_PUBLISH_DIRTY_AFTER_BUILD/);
});
