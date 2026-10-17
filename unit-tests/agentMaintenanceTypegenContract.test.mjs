import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
	new URL("../scripts/agent-quality-gate.sh", import.meta.url),
	"utf8",
);

test("maintenance and build gates share route typegen", () => {
	const checks = source.split("run_project_checks() {")[1]?.split("\n}")[0];
	assert.ok(checks, "shared check sequence must exist");
	const commands = [
		"npm run lint",
		"npm run lint:css",
		"npx next typegen",
		"npm run typecheck",
		"npm run test:unit",
	];
	let previous = -1;
	for (const command of commands) {
		const index = checks.indexOf(command);
		assert.ok(index > previous, `${command} must follow the previous check`);
		previous = index;
	}
	const dispatch = source.split('case "${build}" in')[1]?.split("\nesac")[0];
	assert.ok(dispatch, "build scope dispatch must exist");
	assert.match(
		dispatch,
		/true\)[\s\S]*?run_project_checks[\s\S]*?false\)[\s\S]*?run_project_checks/,
	);
	assert.doesNotMatch(
		source,
		/run_maintenance_project_checks|run_full_prebuild_checks/,
	);
});
