import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) =>
	readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("quality gate checks production health before build and runs diff-scoped SAST", async () => {
	const ci = await read(".github/workflows/ci.yml");

	const productionGate = ci.indexOf(
		"- name: Verify current production baseline before PR build",
	);
	const checkout = ci.indexOf("- name: Checkout");
	const liveProductionSmoke = ci.indexOf(
		"- name: Revalidate canonical production smoke before PR build",
	);
	const semgrep = ci.indexOf("- name: Run Semgrep SAST on changed source");
	const semgrepEnforcement = ci.indexOf("- name: Enforce Semgrep SAST");
	const install = ci.indexOf("- name: Install dependencies");
	const restoreNextCache = ci.indexOf("- name: Restore Next.js build cache");
	const build = ci.indexOf("- name: Build Next.js production bundle");
	const saveNextCache = ci.indexOf("- name: Save Next.js build cache");

	assert.ok(productionGate >= 0 && productionGate < checkout);
	assert.ok(liveProductionSmoke > checkout);
	assert.ok(semgrep > liveProductionSmoke && semgrep < install);
	assert.ok(semgrepEnforcement > semgrep && semgrepEnforcement < install);
	assert.ok(install < restoreNextCache && restoreNextCache < build);
	assert.ok(saveNextCache > build);

	assert.match(ci, /statuses:\s*read/);
	assert.match(ci, /Production Post-deploy Smoke/);
	assert.match(ci, /Production DAST/);
	assert.match(ci, /\.github\/workflows\/production-dast\.yml/);
	assert.match(ci, /bootstrap requirement skipped for this PR only/);
	assert.match(ci, /steps\.production-baseline\.outputs\.bootstrap-dast/);
	assert.match(ci, /Verify production DAST can reach the application/);
	assert.match(ci, /Bootstrap production DAST before first DAST-enabled merge/);
	assert.match(ci, /ZAP_AUTH_HEADER_VALUE/);
	assert.match(ci, /Production DAST preflight did not reach the application/);
	assert.match(ci, /Clean ZAP bootstrap workspace/);
	assert.match(ci, /zap-production-bootstrap-report/);
	assert.match(
		ci,
		/semgrep\/semgrep@sha256:12672acdb0949e19f9f6a4c2b288edd0b404f268f0ca7738a2c06f372f50362e/,
	);
	assert.match(ci, /--config p\/ci/);
	assert.match(ci, /--metrics=off/);
	assert.match(ci, /--sarif/);
	assert.match(ci, /--output \/src\/semgrep\.sarif/);
	assert.match(
		ci,
		/github\/codeql-action\/upload-sarif@cdf488f595d80d6e07e03d4674febd5ab45fa938 # v4/,
	);
	assert.match(ci, /category:\s*"semgrep-pr"/);
	assert.match(ci, /name:\s*semgrep-sast-report/);
	assert.match(ci, /Clean Semgrep SAST workspace/);
	assert.match(ci, /run: rm -f semgrep\.sarif/);
	assert.match(ci, /security-events:\s*write/);
	assert.match(ci, /steps\.semgrep-sast\.outcome != 'success'/);
	assert.match(ci, /git diff --name-only --diff-filter=ACMR/);
	assert.match(ci, /\.github\/workflows\/\.\*\\\.ya\?ml/);
	assert.match(ci, /git show "\$\{BASE_SHA\}:scripts\/post-deploy-smoke\.mjs"/);
	assert.match(ci, /DEPLOYED_SHA="\$BASE_SHA" node "\$smoke_script"/);
	assert.match(ci, /path: \.next\/cache/);
	assert.match(ci, /steps\.next-cache\.outputs\.cache-hit != 'true'/);
});

test("Preview and production DAST share a reviewed passive ZAP policy", async () => {
	const [preview, production, rules, smoke, checkpoint] = await Promise.all([
		read(".github/workflows/playwright.yml"),
		read(".github/workflows/production-dast.yml"),
		read(".zap/rules.tsv"),
		read(".github/workflows/production-smoke.yml"),
		read(".github/workflows/vercel-preview.yml"),
	]);

	for (const workflow of [preview, production]) {
		assert.match(
			workflow,
			/zaproxy\/action-baseline@de8ad967d3548d44ef623df22cf95c3b0baf8b25 # v0\.15\.0/,
		);
		assert.match(workflow, /rules_file_name:\s*"\.zap\/rules\.tsv"/);
		assert.match(workflow, /fail_action:\s*true/);
		assert.match(workflow, /cmd_options:\s*"-I -T 5 -c \.zap\/rules\.tsv"/);
	}

	assert.match(preview, /ZAP_AUTH_HEADER:\s*x-vercel-protection-bypass/);
	assert.match(preview, /ZAP_AUTH_HEADER_VALUE/);
	assert.match(preview, /ZAP_AUTH_HEADER_SITE/);
	assert.match(preview, /Clean ZAP Preview workspace/);
	assert.match(preview, /zap-preview-report/);

	assert.match(production, /https:\/\/www\.albanandrieu\.com/);
	assert.match(production, /vercel\.deployment\.success/);
	assert.match(
		production,
		/github\.event\.client_payload\.git\.ref == 'master'/,
	);
	assert.match(production, /Production DAST/);
	assert.match(production, /ZAP_AUTH_HEADER:\s*x-vercel-protection-bypass/);
	assert.match(production, /ZAP_AUTH_HEADER_VALUE/);
	assert.match(production, /ZAP_AUTH_HEADER_SITE:\s*www\.albanandrieu\.com/);
	assert.match(production, /HTTP \$status, x-vercel-mitigated/);
	assert.match(production, /Clean ZAP production workspace/);
	assert.match(production, /zap-production-report/);
	assert.match(smoke, /Production Post-deploy Smoke/);

	for (const rule of ["10020", "10021", "10033", "10035"]) {
		assert.match(rules, new RegExp(`^${rule}\\tFAIL\\t`, "m"));
	}
	assert.match(rules, /^10038\tWARN\t/m);
	assert.match(checkpoint, /filename\.startsWith\('\.zap\/'\)/);
	assert.match(checkpoint, /workflow_run:/);
	assert.match(checkpoint, /CI \(Quality and Security\)/);
	assert.match(
		checkpoint,
		/github\.event\.workflow_run\.conclusion == 'success'/,
	);
	assert.match(
		checkpoint,
		/github\.event\.workflow_run\.event == 'pull_request'/,
	);
	assert.match(
		checkpoint,
		/github\.event\.workflow_run\.pull_requests\[0\]\.number/,
	);

	const securityWorkflows = [
		ciWorkflowPinContract(await read(".github/workflows/ci.yml")),
		ciWorkflowPinContract(preview),
		ciWorkflowPinContract(smoke),
		ciWorkflowPinContract(production),
		ciWorkflowPinContract(checkpoint),
	];
	assert.equal(securityWorkflows.length, 5);
});

function ciWorkflowPinContract(workflow: string) {
	assert.doesNotMatch(
		workflow,
		/^\s*uses:\s+[^\s#]+@v\d+(?:\.\d+\.\d+)?\s*$/m,
		"security workflows must not use mutable action version tags",
	);
	assert.match(
		workflow,
		/^\s*uses:\s+[^\s#]+@[0-9a-f]{40}\s+#\s+v/m,
		"security workflows must pin actions to immutable commit SHAs",
	);
	return true;
}
