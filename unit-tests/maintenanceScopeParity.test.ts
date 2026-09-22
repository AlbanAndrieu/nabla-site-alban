import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) =>
	readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("maintenance paths stay aligned across local scope, on-demand Preview and production baseline", async () => {
	const [scope, workflow, onDemandWorkflow, baseline, baselineClassification] =
		await Promise.all([
			read("scripts/ci-scope.sh"),
			read(".github/workflows/ci.yml"),
			read(".github/workflows/vercel-preview.yml"),
			read("scripts/verify-production-baseline.sh"),
			read("scripts/lib/production-baseline-classification.sh"),
		]);
	const productionBaselinePolicy = `${baseline}\n${baselineClassification}`;

	const sharedMaintenancePrefixes = [
		["docs/*", "filename.startsWith('docs/')"],
		["unit-tests/*", "filename.startsWith('unit-tests/')"],
	] as const;

	for (const [shellPattern, jsPredicate] of sharedMaintenancePrefixes) {
		assert.ok(
			scope.includes(shellPattern),
			`${shellPattern} missing from CI scope`,
		);
		assert.ok(
			onDemandWorkflow.includes(jsPredicate),
			`${jsPredicate} missing from on-demand Preview scope`,
		);
		assert.ok(
			productionBaselinePolicy.includes(shellPattern),
			`${shellPattern} missing from production-baseline scope`,
		);
	}

	const sharedMaintenancePaths = [
		"scripts/agent-quality-gate.sh",
		"scripts/quality-gate.sh",
		"scripts/ci-scope.sh",
		"scripts/verify-production-baseline.sh",
		"scripts/publish-vercel-preview-checkpoint.sh",
		"scripts/check_code_size.py",
		"scripts/eslint-github-formatter.mjs",
	];

	for (const path of sharedMaintenancePaths) {
		assert.ok(scope.includes(path), `${path} missing from CI scope`);
		assert.ok(
			onDemandWorkflow.includes(`filename === '${path}'`),
			`${path} missing from on-demand Preview scope`,
		);
		assert.ok(
			productionBaselinePolicy.includes(path),
			`${path} missing from production-baseline scope`,
		);
	}

	assert.match(workflow, /needs\.quality\.outputs\.preview_required == 'true'/);
	assert.match(
		workflow,
		/preview_required:\s*\$\{\{ steps\.ci-scope\.outputs\.preview_required \}\}/,
	);
	assert.doesNotMatch(workflow, /const safeOnly/);
	assert.doesNotMatch(workflow, /deployRelevant/);

	assert.match(onDemandWorkflow, /publish-vercel-preview-checkpoint\.sh/);
	assert.doesNotMatch(
		onDemandWorkflow,
		/github\.rest\.git\.(?:createRef|updateRef)/,
	);
	assert.doesNotMatch(onDemandWorkflow, /forceCheckpoint/);

	const classifierPath = "scripts/lib/production-baseline-classification.sh";
	assert.ok(
		baselineClassification.includes(classifierPath),
		"classifier must accept its own policy-only maintenance hop",
	);
	const maintenanceStart = scope.indexOf("is_maintenance_only_path() {");
	const previewStart = scope.indexOf("is_preview_safe_path() {");
	assert.ok(
		maintenanceStart >= 0 && previewStart > maintenanceStart,
		"CI scope classifier functions must remain ordered and discoverable",
	);
	const maintenanceOnlyScope = scope.slice(maintenanceStart, previewStart);
	assert.ok(
		!maintenanceOnlyScope.includes(classifierPath),
		"classifier changes must stay on full CI security scope",
	);
	assert.ok(
		onDemandWorkflow.includes(`filename === '${classifierPath}'`),
		"classifier changes must skip on-demand Preview deployment",
	);

	for (const path of [
		"scripts/lib/agent-quality-support.sh",
		"scripts/agent-publish.sh",
	]) {
		assert.ok(
			scope.includes(path),
			`${path} missing from CI maintenance scope`,
		);
		assert.ok(
			onDemandWorkflow.includes(`filename === '${path}'`),
			`${path} missing from on-demand Preview safe scope`,
		);
	}
});
