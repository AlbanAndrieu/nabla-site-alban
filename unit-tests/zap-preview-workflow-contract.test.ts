import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowUrl = new URL(
	"../.github/workflows/zap-preview.yml",
	import.meta.url,
);

test("ZAP scans only exact Vercel Preview checkpoint deployments", async () => {
	const workflow = await readFile(workflowUrl, "utf8");

	assert.match(workflow, /repository_dispatch:/);
	assert.match(workflow, /workflow_dispatch:/);
	assert.match(workflow, /base_url:/);
	assert.match(workflow, /git_sha:/);
	assert.match(workflow, /preview_ref:/);
	assert.match(workflow, /vercel\.deployment\.success/);
	assert.match(workflow, /vercel-preview-pr-/);
	assert.match(workflow, /environment != 'production'/);
	assert.match(workflow, /git\.ref != 'master'/);
	assert.match(workflow, /github\.event\.client_payload\.url/);
	assert.match(workflow, /github\.event\.client_payload\.git\.sha/);
	assert.match(workflow, /github\.rest\.git\.getRef/);
	assert.match(
		workflow,
		/checkpoint\.object\.sha !== process\.env\.DEPLOYED_SHA/,
	);
	assert.match(workflow, /\.vercel\.app/);

	assert.doesNotMatch(workflow, /www\.albanandrieu\.com/);
	assert.doesNotMatch(workflow, /localhost|127\.0\.0\.1/);
});

test("ZAP checks out the exact deployed policy before scanning", async () => {
	const workflow = await readFile(workflowUrl, "utf8");

	const verify = workflow.indexOf("Verify Preview checkpoint exact SHA");
	const checkout = workflow.indexOf("Checkout exact deployed ZAP policy");
	const scan = workflow.indexOf(
		"Run OWASP ZAP baseline against Vercel Preview",
	);

	assert.ok(verify >= 0);
	assert.ok(checkout > verify);
	assert.ok(scan > checkout);
	assert.match(
		workflow,
		/actions\/checkout@d23441a48e516b6c34aea4fa41551a30e30af803/,
	);
	assert.match(workflow, /ref: \$\{\{ env\.DEPLOYED_SHA \}\}/);
	assert.match(workflow, /persist-credentials: false/);
	assert.match(workflow, /sparse-checkout:[\s\S]*\.zap\/rules\.tsv/);
	assert.match(workflow, /sparse-checkout-cone-mode: false/);
});

test("ZAP negotiates Vercel Automation Bypass or OIDC and scopes the selected header to the scanner", async () => {
	const workflow = await readFile(workflowUrl, "utf8");

	assert.match(workflow, /id-token: write/);
	assert.match(workflow, /core\.getIDToken/);
	assert.match(workflow, /x-vercel-protection-bypass/);
	assert.match(workflow, /x-vercel-trusted-oidc-idp-token/);
	assert.match(
		workflow,
		/Neither Vercel Automation Bypass nor GitHub Actions OIDC/,
	);
	assert.match(workflow, /ZAP_AUTH_HEADER_SITE=/);
	assert.match(workflow, /x-vercel-mitigated/);
	assert.match(workflow, /Vercel Security Checkpoint/);
});

test("ZAP baseline enforces explicit policy and publishes actionable exact-SHA diagnostics", async () => {
	const workflow = await readFile(workflowUrl, "utf8");

	assert.ok(
		workflow.includes(
			"zaproxy/action-baseline@de8ad967d3548d44ef623df22cf95c3b0baf8b25",
		),
	);
	assert.match(workflow, /docker_name: ghcr\.io\/zaproxy\/zaproxy:2\.17\.0/);
	assert.match(workflow, /rules_file_name: "\.zap\/rules\.tsv"/);
	assert.match(workflow, /allow_issue_writing: false/);
	assert.match(workflow, /fail_action: true/);
	assert.match(workflow, /cmd_options: "-I -T 5 -c \.zap\/rules\.tsv"/);
	assert.match(workflow, /continue-on-error: true/);
	assert.match(workflow, /artifact_name: zap-preview-report/);
	assert.match(workflow, /Summarize ZAP Preview diagnostics/);
	assert.match(workflow, /report_json\.json/);
	assert.match(workflow, /Top alert types/);
	assert.match(workflow, /id: summary/);
	assert.match(workflow, /report_available=\$report_available/);
	assert.match(workflow, /high=\$high/);
	assert.match(workflow, /medium=\$medium/);
	assert.match(workflow, /Enforce ZAP Preview policy/);
	assert.match(
		workflow,
		/scanner\/configuration error, not a security finding/,
	);
	assert.match(workflow, /blocking finding/);
	assert.match(workflow, /context 'OWASP ZAP Preview'/);
	assert.match(workflow, /statuses: write/);
	assert.match(workflow, /ZAP Preview access preflight failed/);
	assert.match(workflow, /ZAP Preview passed \$counts/);
	assert.match(workflow, /ZAP Preview scanner error: no report/);
	assert.match(workflow, /ZAP Preview blocked \$counts/);
});

test("Playwright and ZAP Preview remain separate exact-SHA gates", async () => {
	const playwright = await readFile(
		new URL("../.github/workflows/playwright.yml", import.meta.url),
		"utf8",
	);

	assert.doesNotMatch(playwright, /zaproxy\/action-baseline/);
	assert.match(playwright, /context 'Playwright Preview E2E'/);
	assert.match(playwright, /OWASP ZAP Preview/);
	assert.match(playwright, /id-token: write/);
	assert.match(playwright, /x-vercel-trusted-oidc-idp-token/);
});
