import assert from "node:assert/strict";
import { constants } from "node:fs";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

type RenovateRule = {
	description?: string;
	matchManagers?: string[];
	matchDepTypes?: string[];
	matchPackageNames?: string[];
	matchUpdateTypes?: string[];
	groupName?: string;
	groupSlug?: string;
	schedule?: string[];
	minimumReleaseAge?: string;
	internalChecksFilter?: string;
	dependencyDashboardApproval?: boolean;
};

type RenovateConfig = {
	extends?: string[];
	timezone?: string;
	enabledManagers?: string[];
	dependencyDashboard?: boolean;
	automerge?: boolean;
	rebaseWhen?: string;
	prConcurrentLimit?: number;
	branchConcurrentLimit?: number;
	prHourlyLimit?: number;
	commitHourlyLimit?: number;
	"pre-commit"?: { enabled?: boolean };
	osvVulnerabilityAlerts?: boolean;
	packageRules?: RenovateRule[];
};

async function loadConfig() {
	return JSON.parse(await readFile("renovate.json", "utf8")) as RenovateConfig;
}

function rule(config: RenovateConfig, description: string) {
	const found = config.packageRules?.find(
		(candidate) => candidate.description === description,
	);
	assert.ok(found, `missing Renovate rule: ${description}`);
	return found;
}

test("routine dependency updates have one conservative Renovate owner", async () => {
	const config = await loadConfig();

	assert.deepEqual(config.enabledManagers, [
		"npm",
		"github-actions",
		"pre-commit",
	]);
	assert.equal(config.timezone, "Europe/Paris");
	assert.equal(config.dependencyDashboard, true);
	assert.equal(config.automerge, false);
	assert.equal(config.rebaseWhen, "conflicted");
	assert.equal(config.prConcurrentLimit, 2);
	assert.equal(config.branchConcurrentLimit, 2);
	assert.equal(config.prHourlyLimit, 1);
	assert.equal(config.commitHourlyLimit, 1);
	assert.equal(config["pre-commit"]?.enabled, true);
	assert.ok(config.extends?.includes(":enablePreCommit"));
	assert.ok(config.extends?.includes(":combinePatchMinorReleases"));
	assert.ok(config.extends?.includes(":maintainLockFilesDisabled"));
	assert.equal(config.osvVulnerabilityAlerts, false);
	assert.ok(
		config.extends?.includes(
			":enableVulnerabilityAlertsWithAdditionalLabel(security)",
		),
	);

	await assert.rejects(
		access(".github/dependabot.yml", constants.F_OK),
		(error: NodeJS.ErrnoException) => error.code === "ENOENT",
	);

	const gitlab = await readFile(".gitlab-ci.yml", "utf8");
	assert.doesNotMatch(gitlab, /dependabot-gitlab/);
	assert.doesNotMatch(gitlab, /^renovate:/m);
	assert.doesNotMatch(gitlab, /^run_renovate:/m);
	assert.doesNotMatch(gitlab, /RENOVATE_PLATFORM|RENOVATE_EXTRA_FLAGS/);
	assert.match(gitlab, /renovate-config-validator\.gitlab-ci\.yml/);
});

test("npm updates are aged and grouped by operational risk", async () => {
	const config = await loadConfig();

	const age = rule(config, "Wait seven days before routine npm upgrades");
	assert.equal(age.minimumReleaseAge, "7 days");
	assert.equal(age.internalChecksFilter, "strict");

	const majors = rule(
		config,
		"Require Dependency Dashboard approval for disruptive updates",
	);
	assert.deepEqual(majors.matchUpdateTypes, ["major", "replacement"]);
	assert.equal(majors.dependencyDashboardApproval, true);

	const runtime = rule(config, "Group non-major runtime npm updates weekly");
	assert.deepEqual(runtime.matchDepTypes, ["dependencies"]);
	assert.deepEqual(runtime.matchPackageNames, ["!next"]);
	assert.equal(runtime.groupName, "runtime dependencies");
	assert.deepEqual(runtime.schedule, ["* 0-3 * * 1"]);

	const development = rule(
		config,
		"Group non-major development dependencies monthly",
	);
	assert.deepEqual(development.matchDepTypes, ["devDependencies"]);
	assert.equal(development.groupName, "development dependencies");
	assert.deepEqual(development.matchPackageNames, ["!eslint-config-next"]);
	assert.deepEqual(development.schedule, ["* 0-3 1 * *"]);

	const nextStack = rule(
		config,
		"Keep Next.js and eslint-config-next aligned weekly",
	);
	assert.deepEqual(nextStack.matchPackageNames, ["next", "eslint-config-next"]);
	assert.deepEqual(nextStack.matchUpdateTypes, [
		"major",
		"minor",
		"patch",
		"pin",
		"digest",
	]);
	assert.equal(nextStack.groupName, "Next.js stack");
	assert.deepEqual(nextStack.schedule, ["* 0-3 * * 1"]);
});

test("automation tooling shares one monthly Renovate group", async () => {
	const config = await loadConfig();
	const automation = rule(
		config,
		"Group automation tooling maintenance monthly",
	);

	assert.deepEqual(automation.matchManagers, ["github-actions", "pre-commit"]);
	assert.equal(automation.groupName, "automation toolchain");
	assert.equal(automation.groupSlug, "automation-toolchain");
	assert.deepEqual(automation.schedule, ["* 0-3 1 * *"]);
});
