import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowUrl = new URL("../.github/workflows/ci.yml", import.meta.url);

test("CI scans every PR commit with pinned, redacted BetterLeaks before npm", async () => {
	const workflow = await readFile(workflowUrl, "utf8");
	const index = (name: string) => workflow.indexOf(name);

	assert.match(workflow, /BetterLeaks committed PR diff \(blocking\)/);
	assert.match(
		workflow,
		/github\.event_name == 'pull_request' && github\.event\.pull_request\.draft == false/,
	);
	assert.match(
		workflow,
		/BASE_SHA: \$\{\{ steps\.production-baseline\.outputs\.base-sha \}\}/,
	);
	assert.match(
		workflow,
		/HEAD_SHA: \$\{\{ github\.event\.pull_request\.head\.sha \}\}/,
	);
	assert.match(workflow, /test "\$\(git rev-parse HEAD\)" = "\$HEAD_SHA"/);
	assert.match(workflow, /git cat-file -e "\$\{BASE_SHA\}\^\{commit\}"/);
	assert.match(
		workflow,
		/go install github\.com\/betterleaks\/betterleaks@v1\.9\.0/,
	);
	assert.match(workflow, /--log-opts="\$\{BASE_SHA\}\.\.\$\{HEAD_SHA\}"/);
	assert.match(workflow, /--config \.betterleaks\.toml --redact/);
	assert.ok(
		index("BetterLeaks committed PR diff") <
			index("Run canonical changed-file quality gate"),
	);
	assert.ok(
		index("BetterLeaks committed PR diff") < index("Install dependencies"),
	);
	assert.doesNotMatch(workflow, /betterleaks.*--no-redact/);
});

test("CI blocks production HIGH/CRITICAL npm SCA and full-tree CRITICAL", async () => {
	const workflow = await readFile(workflowUrl, "utf8");
	const prod = workflow.indexOf(
		"Audit production npm dependencies (blocking SCA)",
	);
	const full = workflow.indexOf(
		"Report full npm SCA and development-tool debt",
	);
	const install = workflow.indexOf("- name: Install dependencies");
	assert.ok(prod > 0 && full > prod && install > full);
	assert.match(workflow, /npm audit --omit=dev --audit-level=high/);
	assert.match(workflow, /npm audit --json > "\$report" \|\| audit_exit=\$\?/);
	assert.match(workflow, /metadata\.vulnerabilities \| type == "object"/);
	assert.match(workflow, /critical > 0/);
	assert.match(
		workflow,
		/audit_exit != 0 && high == 0 && moderate == 0 && low == 0/,
	);
	assert.match(workflow, /Snyk is optional and complementary/);
	assert.match(workflow, /npm ci --no-audit --no-fund/);
});
