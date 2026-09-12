import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import {
	chmod,
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

const execFileAsync = promisify(execFile);
const SCRIPT = fileURLToPath(
	new URL("../scripts/agent-publish.sh", import.meta.url),
);

async function git(cwd: string, ...args: string[]): Promise<string> {
	const { stdout } = await execFileAsync("git", args, { cwd });
	return stdout.trim();
}

async function makeExecutable(pathname: string, content: string) {
	await writeFile(pathname, content);
	await chmod(pathname, 0o755);
}

test("publication proof reuses an exact HEAD/base/toolchain pass and invalidates on changes", async () => {
	const cwd = await mkdtemp(path.join(os.tmpdir(), "nabla-publish-proof-"));
	try {
		await git(cwd, "init");
		await git(cwd, "config", "user.email", "publish-proof@example.invalid");
		await git(cwd, "config", "user.name", "Publish Proof Test");
		await writeFile(path.join(cwd, "README.md"), "base\n");
		await git(cwd, "add", "README.md");
		await git(cwd, "commit", "-m", "base");

		await mkdir(path.join(cwd, "scripts"), { recursive: true });
		await makeExecutable(
			path.join(cwd, "scripts/agent-quality-gate.sh"),
			`#!/usr/bin/env bash\nset -euo pipefail\nprintf '1\\n' >> "\${QUALITY_TEST_COUNTER}"\n`,
		);
		await git(cwd, "add", "scripts/agent-quality-gate.sh");
		await git(cwd, "commit", "-m", "head");

		const counter = path.join(cwd, ".git", "gate-count.txt");
		const bin = path.join(cwd, ".git", "fake-bin");
		await mkdir(bin);
		for (const [name, version] of [
			["node", "v26.8.2"],
			["npm", "11.17.0"],
			["python3", "Python 3.13.15"],
			["pre-commit", "pre-commit 4.6.2"],
		] as const) {
			await makeExecutable(
				path.join(bin, name),
				`#!/usr/bin/env bash\nprintf '%s\\n' '${version}'\n`,
			);
		}
		const env = {
			...process.env,
			PATH: `${bin}:${process.env.PATH ?? ""}`,
			QUALITY_BASE_REF: "",
			QUALITY_TEST_COUNTER: counter,
		};

		const first = await execFileAsync("bash", [SCRIPT], { cwd, env });
		assert.match(first.stdout, /QG_PUBLISH_PROOF_WRITTEN/);
		const second = await execFileAsync("bash", [SCRIPT], { cwd, env });
		assert.match(second.stdout, /QG_PUBLISH_PROOF_REUSED/);
		assert.equal(
			(await readFile(counter, "utf8")).trim().split("\n").length,
			1,
		);

		await writeFile(path.join(cwd, "README.md"), "dirty\n");
		await assert.rejects(
			execFileAsync("bash", [SCRIPT], { cwd, env }),
			(error: unknown) =>
				Boolean(
					error &&
						typeof error === "object" &&
						"stderr" in error &&
						String((error as { stderr: unknown }).stderr).includes(
							"QG_PUBLISH_DIRTY",
						),
				),
		);

		await git(cwd, "add", "README.md");
		await git(cwd, "commit", "-m", "new-head");
		const third = await execFileAsync("bash", [SCRIPT], { cwd, env });
		assert.match(third.stdout, /QG_PUBLISH_PROOF_WRITTEN/);
		assert.equal(
			(await readFile(counter, "utf8")).trim().split("\n").length,
			2,
		);
	} finally {
		await rm(cwd, { recursive: true, force: true });
	}
});
