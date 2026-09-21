import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

type Call = Record<string, unknown>;
type Environment = Record<string, string>;
type HarnessOptions = {
	dispatchError?: string;
	pullError?: string;
	failedJobs?: Call[];
	openIssues?: Call[];
};

const WORKFLOW = ".github/workflows/post-merge-quality-remediation.yml";
const AsyncFunction = Object.getPrototypeOf(async () => undefined).constructor as new (
	...args: string[]
) => (...args: unknown[]) => Promise<unknown>;

async function remediationScript() {
	const workflow = await readFile(WORKFLOW, "utf8");
	const stepMarker = "- name: Open remediation PR or diagnostic issue";
	const scriptMarker = "          script: |\n";
	const stepIndex = workflow.indexOf(stepMarker);
	const scriptIndex = workflow.indexOf(scriptMarker, stepIndex);

	assert.notEqual(stepIndex, -1);
	assert.notEqual(scriptIndex, -1);

	const lines = workflow
		.slice(scriptIndex + scriptMarker.length)
		.split("\n");
	const scriptLines: string[] = [];
	for (const line of lines) {
		if (line.startsWith("            ")) {
			scriptLines.push(line.slice(12));
			continue;
		}
		if (line === "") {
			scriptLines.push("");
			continue;
		}
		break;
	}
	return scriptLines.join("\n");
}

function baseEnvironment(overrides: Environment = {}): Environment {
	return {
		PREPARE_RESULT: "success",
		REMEDIATION_ACTION: "pr",
		REMEDIATION_BRANCH: "automation/quality-remediation-123-1",
		REMEDIATION_REASON: "deterministic auto-fix reached a clean pass",
		PUBLISH_OUTCOME: "success",
		EXISTING_PR_FOUND: "false",
		EXISTING_PR_BRANCH: "",
		EXISTING_PR_NUMBER: "",
		EXISTING_PR_URL: "",
		FAILED_RUN_ID: "123",
		FAILED_RUN_URL: "https://example.invalid/run/123",
		FAILED_SHA: "0123456789abcdef0123456789abcdef01234567",
		FAILED_CONCLUSION: "failure",
		...overrides,
	};
}

function makeHarness(options: HarnessOptions = {}) {
	const calls = {
		dispatches: [] as Call[],
		pulls: [] as Call[],
		issues: [] as Call[],
	};
	const notices: string[] = [];
	const warnings: string[] = [];
	const listJobs = async () => [];
	const listIssues = async () => [];
	const github = {
		paginate: async (fn: unknown) => {
			if (fn === listJobs) return options.failedJobs ?? [];
			if (fn === listIssues) return options.openIssues ?? [];
			throw new Error("unexpected paginate target");
		},
		rest: {
			actions: {
				listJobsForWorkflowRun: listJobs,
				createWorkflowDispatch: async (args: Call) => {
					calls.dispatches.push(args);
					if (options.dispatchError) throw new Error(options.dispatchError);
				},
			},
			pulls: {
				create: async (args: Call) => {
					calls.pulls.push(args);
					if (options.pullError) throw new Error(options.pullError);
					return {
						data: {
							number: 42,
							html_url: "https://example.invalid/pr/42",
						},
					};
				},
			},
			issues: {
				listForRepo: listIssues,
				create: async (args: Call) => {
					calls.issues.push(args);
					return {
						data: {
							number: 99,
							html_url: "https://example.invalid/issues/99",
						},
					};
				},
			},
		},
	};
	const core = {
		notice: (value: unknown) => notices.push(String(value)),
		warning: (value: unknown) => warnings.push(String(value)),
	};
	const context = {
		repo: { owner: "AlbanAndrieu", repo: "nabla-site-alban" },
	};
	return { calls, context, core, github, notices, warnings };
}

async function runRemediation(
	environment: Environment,
	options: HarnessOptions = {},
) {
	const harness = makeHarness(options);
	const script = await remediationScript();
	const run = new AsyncFunction("github", "core", "context", "process", script);
	await run(harness.github, harness.core, harness.context, { env: environment });
	return harness;
}

test("successful remediation PR dispatches canonical CI without opening an issue", async () => {
	const environment = baseEnvironment();
	const harness = await runRemediation(environment);

	assert.equal(harness.calls.pulls.length, 1);
	assert.equal(harness.calls.dispatches.length, 1);
	assert.equal(harness.calls.dispatches[0].workflow_id, "ci.yml");
	assert.equal(
		harness.calls.dispatches[0].ref,
		environment.REMEDIATION_BRANCH,
	);
	assert.equal(harness.calls.issues.length, 0);
});

test("branch publication failure falls back to a diagnostic issue", async () => {
	const harness = await runRemediation(
		baseEnvironment({ PUBLISH_OUTCOME: "failure" }),
	);

	assert.equal(harness.calls.pulls.length, 0);
	assert.equal(harness.calls.dispatches.length, 0);
	assert.equal(harness.calls.issues.length, 1);
	assert.match(
		String(harness.calls.issues[0].body),
		/remediation branch publication failed/,
	);
});

test("PR publication failure falls back to a diagnostic issue", async () => {
	const harness = await runRemediation(baseEnvironment(), {
		pullError: "pull denied",
	});

	assert.equal(harness.calls.pulls.length, 1);
	assert.equal(harness.calls.dispatches.length, 0);
	assert.equal(harness.calls.issues.length, 1);
	assert.match(String(harness.calls.issues[0].body), /unable to open remediation PR/);
	assert.match(String(harness.calls.issues[0].body), /Automation fallback/);
});

test("CI dispatch failure after PR creation falls back to a diagnostic issue", async () => {
	const harness = await runRemediation(baseEnvironment(), {
		dispatchError: "dispatch denied",
	});

	assert.equal(harness.calls.pulls.length, 1);
	assert.equal(harness.calls.dispatches.length, 1);
	assert.equal(harness.calls.issues.length, 1);
	assert.match(
		String(harness.calls.issues[0].body),
		/canonical CI dispatch failed/,
	);
	assert.match(String(harness.calls.issues[0].body), /remediation PR #42 exists/);
});

test("existing remediation PR is reused without a duplicate PR or issue", async () => {
	const harness = await runRemediation(
		baseEnvironment({
			EXISTING_PR_FOUND: "true",
			EXISTING_PR_BRANCH: "automation/quality-remediation-123-1",
			EXISTING_PR_NUMBER: "41",
			EXISTING_PR_URL: "https://example.invalid/pr/41",
			PUBLISH_OUTCOME: "skipped",
		}),
	);

	assert.equal(harness.calls.pulls.length, 0);
	assert.equal(harness.calls.dispatches.length, 1);
	assert.equal(harness.calls.issues.length, 0);
});

test("existing diagnostic issue deduplicates fallback creation", async () => {
	const failedSha = baseEnvironment().FAILED_SHA;
	const harness = await runRemediation(
		baseEnvironment({ PUBLISH_OUTCOME: "failure" }),
		{
			openIssues: [
				{
					body: `<!-- post-merge-quality-remediation:${failedSha} -->`,
					html_url: "https://example.invalid/issues/7",
				},
			],
		},
	);

	assert.equal(harness.calls.issues.length, 0);
	assert.match(harness.notices.join("\n"), /Diagnostic issue already exists/);
});
