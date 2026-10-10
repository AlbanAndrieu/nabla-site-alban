import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import {
	chmod,
	copyFile,
	mkdir,
	mkdtemp,
	readFile,
	rm,
	writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execute = promisify(execFile);
const project = fileURLToPath(new URL("../", import.meta.url));
const contextScript = path.join(project, "scripts/agent-offline-context.sh");

async function git(cwd: string, ...args: string[]) {
	return execute("git", args, { cwd });
}

async function fixture() {
	const cwd = await mkdtemp(path.join(os.tmpdir(), "nabla-offline-"));
	await git(cwd, "init", "-q", "-b", "master");
	await git(cwd, "config", "user.email", "test@example.invalid");
	await git(cwd, "config", "user.name", "Test");
	await writeFile(path.join(cwd, "example.txt"), "base\n");
	await git(cwd, "add", "example.txt");
	await git(cwd, "commit", "-qm", "base");
	await git(cwd, "update-ref", "refs/remotes/origin/master", "HEAD");
	await git(cwd, "switch", "-qc", "fix/offline-test");
	await writeFile(path.join(cwd, "example.txt"), "changed\n");
	return cwd;
}

test("offline preflight uses cached Git refs without network or node_modules", async () => {
	const cwd = await fixture();
	try {
		const context = await execute("bash", [contextScript, "context"], {
			cwd,
		});
		assert.match(context.stdout, /AGENT_CONTEXT branch=fix\/offline-test/);
		assert.match(context.stdout, /changed=1/);
		const preflight = await execute("bash", [contextScript, "preflight"], {
			cwd,
		});
		assert.match(preflight.stdout, /AGENT_OFFLINE_PREFLIGHT_OK/);
		assert.match(preflight.stdout, /QG_OFFLINE_DEPS_MISSING/);
		await git(cwd, "switch", "-q", "master");
		await assert.rejects(
			execute("bash", [contextScript, "preflight"], { cwd }),
			(error: unknown) =>
				String((error as { stderr: string }).stderr).includes(
					"QG_OFFLINE_PROTECTED_BRANCH",
				),
		);
	} finally {
		await rm(cwd, { recursive: true, force: true });
	}
});

test("auto-fix loop detects an oscillating formatter before 12 passes", async () => {
	const cwd = await fixture();
	try {
		await mkdir(path.join(cwd, "scripts/lib"), { recursive: true });
		for (const p of [
			"scripts/agent-quality-gate.sh",
			"scripts/lib/agent-quality-support.sh",
		]) {
			await copyFile(path.join(project, p), path.join(cwd, p));
		}
		await git(cwd, "add", "scripts");
		await git(cwd, "commit", "-qm", "tools");
		const bin = path.join(cwd, "bin");
		await mkdir(bin);
		const fake = path.join(bin, "pre-commit");
		await writeFile(
			fake,
			"#!/usr/bin/env bash\nif grep -q '^A$' example.txt; then printf 'B\\n' >example.txt; else printf 'A\\n' >example.txt; fi\necho 'oscillating hook Failed'\nexit 1\n",
		);
		await chmod(fake, 0o755);
		await assert.rejects(
			execute("bash", ["scripts/agent-quality-gate.sh", "--fix"], {
				cwd,
				env: { ...process.env, PATH: `${bin}:${process.env.PATH ?? ""}` },
			}),
			(error: unknown) => {
				const stderr = String((error as { stderr: string }).stderr);
				return (
					stderr.includes("QG_FIX_OSCILLATION") &&
					stderr.includes("example.txt")
				);
			},
		);
	} finally {
		await rm(cwd, { recursive: true, force: true });
	}
});

test("offline skill remains explicit about the difference between archive and publication", async () => {
	const [skill, just] = await Promise.all([
		readFile(
			path.join(project, ".agents/skills/nabla-maintenance/SKILL.md"),
			"utf8",
		),
		readFile(path.join(project, "justfile"), "utf8"),
	]);
	assert.match(skill, /snapshot-check/);
	assert.match(
		skill,
		/archive does not contain|archive.*no.*\.git|snapshot.*not.*Git checkout/i,
	);
	assert.match(just, /^context:/m);
	assert.match(just, /^preflight:/m);
	assert.match(just, /^snapshot-check archive head digest destination:/m);
});

test("repository agent entrypoint is compact without losing protected-branch policy", async () => {
	const policy = await readFile(path.join(project, "AGENTS.md"), "utf8");
	assert.ok(
		Buffer.byteLength(policy) < 9000,
		"agent bootstrap exceeds compact context budget",
	);
	for (const essential of [
		"Never",
		"master",
		"quality:agent:publish",
		"Post-merge remediation is recovery only",
		"source-only",
		"just context",
		"just preflight",
	]) {
		assert.ok(
			policy.includes(essential),
			`missing canonical invariant: ${essential}`,
		);
	}
});

test("offline context counts more than 200 paths while printing a bounded summary", async () => {
	const cwd = await fixture();
	try {
		for (let i = 0; i < 205; i++) {
			await writeFile(path.join(cwd, `extra-${i}.txt`), "new\n");
		}
		const { stdout } = await execute("bash", [contextScript, "context"], {
			cwd,
		});
		assert.match(stdout, /changed=206/);
		assert.match(stdout, /194 more/);
		await assert.rejects(
			execute("bash", [contextScript, "preflight"], {
				cwd,
				env: { ...process.env, AGENT_OFFLINE_MAX_PATHS: "200" },
			}),
			(error: unknown) =>
				String((error as { stderr: string }).stderr).includes(
					"QG_OFFLINE_PATH_LIMIT",
				),
		);
	} finally {
		await rm(cwd, { recursive: true, force: true });
	}
});

test("offline inventory fails closed when git diff fails", async () => {
	const cwd = await fixture();
	try {
		const bin = path.join(cwd, "bin");
		await mkdir(bin);
		const wrapper = path.join(bin, "git");
		await writeFile(
			wrapper,
			`#!/usr/bin/env bash
if [[ "$1" == "diff" ]]; then exit 42; fi
exec /usr/bin/git "$@"
`,
		);
		await chmod(wrapper, 0o755);
		await assert.rejects(
			execute("bash", [contextScript, "preflight"], {
				cwd,
				env: { ...process.env, PATH: `${bin}:${process.env.PATH ?? ""}` },
			}),
			(error: unknown) =>
				String((error as { stderr: string }).stderr).includes(
					"QG_OFFLINE_GIT_DIFF_FAILED",
				),
		);
	} finally {
		await rm(cwd, { recursive: true, force: true });
	}
});

test("offline npm helper refuses implicit DNS and requires a lockfile", async () => {
	const script = await readFile(
		path.join(project, "scripts/agent-npm-offline.sh"),
		"utf8",
	);
	const just = await readFile(path.join(project, "justfile"), "utf8");
	assert.match(script, /npm ci --offline --ignore-scripts --no-audit --no-fund/);
	assert.match(script, /QG_NPM_OFFLINE_CACHE_MISS/);
	assert.match(script, /QG_NPM_OFFLINE_INSTALL_REFUSED/);
	assert.doesNotMatch(script, /npm (install|ci)(?! --offline)/);
	assert.match(just, /^npm-offline-check:/m);
	assert.match(just, /^npm-offline-install:/m);
	const result = await execute(
		"bash",
		[path.join(project, "scripts/agent-npm-offline.sh"), "check"],
		{ cwd: project },
	);
	assert.match(result.stdout, /QG_NPM_OFFLINE_CHECK/);
});
