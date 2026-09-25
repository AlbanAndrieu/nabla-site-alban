import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { chmod, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const SCRIPT = fileURLToPath(
	new URL("../scripts/agent-doctor.sh", import.meta.url),
);

async function git(cwd: string, ...args: string[]): Promise<string> {
	const { stdout } = await execFileAsync("git", args, { cwd });
	return stdout.trim();
}

async function writeExecutable(
	filePath: string,
	content: string,
): Promise<void> {
	await writeFile(filePath, content);
	await chmod(filePath, 0o755);
}

test("agent doctor fails closed on branch, hook and toolchain drift", async () => {
	const cwd = await mkdtemp(path.join(os.tmpdir(), "nabla-agent-doctor-"));
	const bin = path.join(cwd, ".test-bin");
	try {
		await git(cwd, "init");
		await git(cwd, "config", "user.email", "agent-doctor@example.invalid");
		await git(cwd, "config", "user.name", "Agent Doctor Test");

		await writeFile(path.join(cwd, ".nvmrc"), "26.8.2\n");
		await writeFile(path.join(cwd, ".python-version"), "3.12.10\n");
		await writeFile(path.join(cwd, "mise.toml"), 'pre-commit = "4.6.2"\n');
		await writeFile(path.join(cwd, "README.md"), "base\n");
		await git(
			cwd,
			"add",
			".nvmrc",
			".python-version",
			"mise.toml",
			"README.md",
		);
		await git(cwd, "commit", "-m", "base");
		await git(cwd, "branch", "-M", "master");
		await git(cwd, "update-ref", "refs/remotes/origin/master", "HEAD");
		await git(
			cwd,
			"symbolic-ref",
			"refs/remotes/origin/HEAD",
			"refs/remotes/origin/master",
		);
		await git(cwd, "switch", "-c", "test/doctor");

		await mkdir(bin);
		await writeExecutable(
			path.join(bin, "node"),
			'#!/usr/bin/env bash\nprintf "v26.8.2\\n"\n',
		);
		await writeExecutable(
			path.join(bin, "npm"),
			'#!/usr/bin/env bash\nprintf "11.17.0\\n"\n',
		);
		await writeExecutable(
			path.join(bin, "python3"),
			'#!/usr/bin/env bash\nprintf "Python 3.12.10\\n"\n',
		);
		await writeExecutable(
			path.join(bin, "pre-commit"),
			'#!/usr/bin/env bash\nprintf "pre-commit 4.6.2\\n"\n',
		);

		const hooks = path.join(cwd, ".git", "hooks");
		for (const hook of ["pre-commit", "commit-msg", "pre-push"]) {
			await writeExecutable(
				path.join(hooks, hook),
				"#!/usr/bin/env bash\nexit 0\n",
			);
		}
		await mkdir(path.join(cwd, "node_modules"));
		await writeFile(
			path.join(cwd, "node_modules", ".package-lock.json"),
			"{}\n",
		);

		const env = {
			...process.env,
			PATH: `${bin}:${process.env.PATH ?? ""}`,
		};
		const healthy = await execFileAsync("bash", [SCRIPT], { cwd, env });
		assert.match(healthy.stdout, /AGENT_DOCTOR_OK/);
		assert.match(healthy.stdout, /branch=test\/doctor/);
		assert.match(healthy.stdout, /node=26\.8\.2/);
		assert.match(healthy.stdout, /npm=11\.17\.0/);
		assert.match(healthy.stdout, /python=3\.12\.10/);
		assert.match(healthy.stdout, /pre-commit=4\.6\.2/);

		await git(cwd, "switch", "master");
		await assert.rejects(
			execFileAsync("bash", [SCRIPT], { cwd, env }),
			(error: unknown) =>
				Boolean(
					error &&
						typeof error === "object" &&
						"stderr" in error &&
						String((error as { stderr: unknown }).stderr).includes(
							"AGENT_DOCTOR_PROTECTED_BRANCH",
						),
				),
		);

		await git(cwd, "switch", "test/doctor");
		await rm(path.join(hooks, "pre-push"));
		await assert.rejects(
			execFileAsync("bash", [SCRIPT], { cwd, env }),
			(error: unknown) =>
				Boolean(
					error &&
						typeof error === "object" &&
						"stderr" in error &&
						String((error as { stderr: unknown }).stderr).includes(
							"AGENT_DOCTOR_HOOK_MISSING",
						),
				),
		);

		await writeExecutable(
			path.join(hooks, "pre-push"),
			"#!/usr/bin/env bash\nexit 0\n",
		);
		await writeExecutable(
			path.join(bin, "node"),
			'#!/usr/bin/env bash\nprintf "v22.0.0\\n"\n',
		);
		await assert.rejects(
			execFileAsync("bash", [SCRIPT], { cwd, env }),
			(error: unknown) =>
				Boolean(
					error &&
						typeof error === "object" &&
						"stderr" in error &&
						String((error as { stderr: unknown }).stderr).includes(
							"AGENT_DOCTOR_VERSION_MISMATCH",
						),
				),
		);
	} finally {
		await rm(cwd, { recursive: true, force: true });
	}
});
