import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path: string) => readFile(path, "utf8");

test("agent quality support owns mechanics but not quality policy", async () => {
	const [gate, support, scope, copilotSetup] = await Promise.all([
		source("scripts/agent-quality-gate.sh"),
		source("scripts/lib/agent-quality-support.sh"),
		source("scripts/ci-scope.sh"),
		source(".github/workflows/copilot-setup-steps.yml"),
	]);

	assert.match(gate, /source scripts\/lib\/agent-quality-support\.sh/);
	for (const helper of [
		"resolve_base_ref",
		"run_compact",
		"run_compact_report",
		"collect_changed_files",
		"collect_deleted_files",
		"workspace_fingerprint",
		"classify_changed_files",
	]) {
		assert.match(support, new RegExp(`${helper}\\(\\)`));
		assert.doesNotMatch(gate, new RegExp(`^${helper}\\(\\)`, "m"));
	}

	assert.match(support, /scripts\/agent-quality-gate\.sh/);
	assert.match(support, /scripts\/lib\/agent-quality-support\.sh/);
	assert.match(gate, /AGENT_GATE_SHELL_FILES/);
	assert.doesNotMatch(support, /bash scripts\/quality-gate\.sh/);
	assert.doesNotMatch(support, /npm run lint/);
	assert.doesNotMatch(support, /pre-commit run/);
	assert.match(scope, /scripts\/lib\/agent-quality-support\.sh/);
	assert.equal(
		(copilotSetup.match(/scripts\/lib\/agent-quality-support\.sh/g) ?? [])
			.length,
		2,
	);
});
