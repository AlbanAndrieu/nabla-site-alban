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
	const semgrep = ci.indexOf("- name: Run Semgrep SAST on changed source");
	const install = ci.indexOf("- name: Install dependencies");
	const build = ci.indexOf("- name: Build Next.js production bundle");

	assert.ok(productionGate >= 0 && productionGate < checkout);
	assert.ok(semgrep > checkout && semgrep < install);
	assert.ok(install < build);

	assert.match(ci, /statuses:\s*read/);
	assert.match(ci, /Production Post-deploy Smoke/);
	assert.match(ci, /Production DAST/);
	assert.match(ci, /\.github\/workflows\/production-dast\.yml/);
	assert.match(ci, /bootstrap requirement skipped for this PR only/);
	assert.match(ci, /semgrep\/semgrep:1\.176\.0/);
	assert.match(ci, /--config p\/ci/);
	assert.match(ci, /--metrics=off/);
	assert.match(ci, /git diff --name-only --diff-filter=ACMR/);
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
		assert.match(workflow, /zaproxy\/action-baseline@v0\.15\.0/);
		assert.match(workflow, /rules_file_name:\s*"\.zap\/rules\.tsv"/);
		assert.match(workflow, /fail_action:\s*true/);
		assert.match(workflow, /cmd_options:\s*"-I -T 5"/);
	}

	assert.match(preview, /ZAP_AUTH_HEADER:\s*x-vercel-protection-bypass/);
	assert.match(preview, /ZAP_AUTH_HEADER_VALUE/);
	assert.match(preview, /ZAP_AUTH_HEADER_SITE/);
	assert.match(preview, /zap-preview-report/);

	assert.match(production, /https:\/\/www\.albanandrieu\.com/);
	assert.match(production, /vercel\.deployment\.success/);
	assert.match(production, /github\.event\.client_payload\.git\.ref == 'master'/);
	assert.match(production, /Production DAST/);
	assert.match(production, /zap-production-report/);
	assert.match(smoke, /Production Post-deploy Smoke/);

	for (const rule of ["10020", "10021", "10033", "10035"]) {
		assert.match(rules, new RegExp(`^${rule}\\tFAIL\\t`, "m"));
	}
	assert.match(rules, /^10038\tWARN\t/m);
	assert.match(checkpoint, /filename\.startsWith\('\.zap\/'\)/);
});
