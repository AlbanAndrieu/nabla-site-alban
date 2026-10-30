#!/usr/bin/env node
/** Read-only task router. No network, installs, CI, secrets, or publication proof. */
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export const TASKS = Object.freeze({
	agent: Object.freeze({
		guide: ".agents/skills/local-first-quality/SKILL.md",
		first: "node --test unit-tests/agentTaskContext.test.mjs",
		next: "node --experimental-strip-types --test unit-tests/agentOfflineLoop.test.ts; just loop",
	}),
	ui: Object.freeze({
		guide: "docs/agent-frontend-standards.md",
		first: "just node22-fast",
		next: "npm run typecheck; then selected Playwright FR/EN + Axe",
	}),
	homelab: Object.freeze({
		guide: "docs/homelab-roadmap.md",
		first: "just node22-fast",
		next: "verify OWNER/SERVICE/WAN evidence; unknown is not healthy",
	}),
	ci: Object.freeze({
		guide: ".agents/skills/nabla-ci-debug/SKILL.md",
		first:
			"node --experimental-strip-types --test unit-tests/agentOfflineLoop.test.ts",
		next: "just loop; inspect first failing step only",
	}),
	security: Object.freeze({
		guide: "docs/agent-frontend-standards.md",
		first: "node --test unit-tests/securityYubiKeyGuide.test.mjs",
		next: "validate scope-specific security contracts and browser access",
	}),
});

export function parseTask(argv) {
	const task =
		argv.length === 1
			? argv[0]
			: argv.length === 2 && argv[0] === "--task"
				? argv[1]
				: null;
	if (!task || !Object.hasOwn(TASKS, task)) {
		throw new Error(
			"AGENT_TASK_INVALID: use --task agent|ui|homelab|ci|security",
		);
	}
	return task;
}

function git(args, cwd = ROOT) {
	const result = spawnSync("git", args, {
		cwd,
		encoding: "utf8",
		timeout: 2500,
		maxBuffer: 65536,
	});
	return result.status === 0 ? result.stdout.trim() : null;
}

export function inspectGit(cwd = ROOT) {
	const head = git(["rev-parse", "--verify", "HEAD"], cwd);
	const branch = git(["symbolic-ref", "--quiet", "--short", "HEAD"], cwd);
	const status = git(
		["status", "--porcelain=v1", "--untracked-files=normal"],
		cwd,
	);
	const base = git(["rev-parse", "--verify", "origin/master^{commit}"], cwd);
	return {
		head: head && /^[a-f0-9]{40}$/.test(head) ? head : "UNAVAILABLE",
		branch: branch || "DETACHED_OR_NO_GIT",
		worktree: status === null ? "UNKNOWN" : status === "" ? "CLEAN" : "DIRTY",
		base: base ? "CACHED_ONLY" : "BASE_MISSING",
	};
}

export function formatContext(task, snapshot) {
	const plan = TASKS[task];
	if (!plan) throw new Error("AGENT_TASK_INVALID");
	return [
		`Task ${task} | branch ${snapshot.branch} | HEAD ${snapshot.head.slice(0, 12)}`,
		`Worktree ${snapshot.worktree} | base ${snapshot.base}`,
		`Read only: ${plan.guide}`,
		`First check: ${plan.first}`,
		`Then: ${plan.next}`,
		"Evidence: NOT_RUN | L3: NOT_RUN (npm run quality:agent:publish)",
		"Do not publish from source-only checks, or bypass CI/security hooks.",
	].join("\n");
}

if (
	process.argv[1] &&
	resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
	try {
		const task = parseTask(process.argv.slice(2));
		const snapshot = inspectGit();
		process.stdout.write(formatContext(task, snapshot) + "\n");
		if (snapshot.head === "UNAVAILABLE") process.exitCode = 3;
	} catch (error) {
		console.error(error.message);
		process.exitCode = 2;
	}
}
