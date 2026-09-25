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

test("publication proof is written only after a clean deployable build", async () => {
	const cwd = await mkdtemp(path.join(os.tmpdir(), "nabla-publish-build-"));
	try {
		await git(cwd, "init");
		await git(cwd, "config", "user.email", "publish-build@example.invalid");
		await git(cwd, "config", "user.name", "Publish Build Integrity Test");
		await writeFile(path.join(cwd, "README.md"), "base\n");
		await git(cwd, "add", "README.md");
		await git(cwd, "commit", "-m", "base");

		await mkdir(path.join(cwd, "scripts"), { recursive: true });
		const gateCounter = path.join(cwd, ".git", "gate-count.txt");
		const buildCounter = path.join(cwd, ".git", "build-count.txt");
		await makeExecutable(
			path.join(cwd, "scripts/agent-quality-gate.sh"),
			`#!/usr/bin/env bash\nset -euo pipefail\nprintf '1\\n' >> "\${QUALITY_TEST_GATE_COUNTER}"\n`,
		);
		await makeExecutable(
			path.join(cwd, "scripts/ci-scope.sh"),
			"#!/usr/bin/env bash\nset -euo pipefail\nprintf '%s\\n' 'build=true'\n",
		);
		await git(
			cwd,
			"add",
			"scripts/agent-quality-gate.sh",
			"scripts/ci-scope.sh",
		);
		await git(cwd, "commit", "-m", "deployable head");
		await git(cwd, "switch", "-c", "test/agent-publication");

		const bin = path.join(cwd, ".git", "fake-bin");
		await mkdir(bin);
		for (const [name, version] of [
			["node", "v26.8.2"],
			["python3", "Python 3.12.10"],
			["pre-commit", "pre-commit 4.6.2"],
		] as const) {
			await makeExecutable(
				path.join(bin, name),
				`#!/usr/bin/env bash\nprintf '%s\\n' '${version}'\n`,
			);
		}

		const npmPath = path.join(bin, "npm");
		await makeExecutable(
			npmPath,
			`#!/usr/bin/env bash
set -euo pipefail
if [[ "\${1:-}" == "--version" ]]; then
    printf '%s\\n' '11.17.0'
    exit 0
fi
if [[ "\${1:-}" == "run" && "\${2:-}" == "build" ]]; then
    printf '1\\n' >> "\${QUALITY_TEST_BUILD_COUNTER}"
    printf 'build mutation\\n' >> README.md
    exit 0
fi
exit 2
`,
		);

		const env = {
			...process.env,
			PATH: `${bin}:${process.env.PATH ?? ""}`,
			QUALITY_BASE_REF: "",
			QUALITY_TEST_GATE_COUNTER: gateCounter,
			QUALITY_TEST_BUILD_COUNTER: buildCounter,
		};

		await assert.rejects(
			execFileAsync("bash", [SCRIPT], { cwd, env }),
			(error: unknown) =>
				Boolean(
					error &&
						typeof error === "object" &&
						"stderr" in error &&
						String((error as { stderr: unknown }).stderr).includes(
							"QG_PUBLISH_DIRTY_AFTER_BUILD",
						),
				),
		);
		assert.equal((await readFile(gateCounter, "utf8")).trim(), "1");
		assert.equal((await readFile(buildCounter, "utf8")).trim(), "1");
		await assert.rejects(
			readFile(path.join(cwd, ".git", "agent-publication-proof"), "utf8"),
		);

		await git(cwd, "restore", "README.md");
		await makeExecutable(
			npmPath,
			`#!/usr/bin/env bash
set -euo pipefail
if [[ "\${1:-}" == "--version" ]]; then
    printf '%s\\n' '11.17.0'
    exit 0
fi
if [[ "\${1:-}" == "run" && "\${2:-}" == "build" ]]; then
    printf '1\\n' >> "\${QUALITY_TEST_BUILD_COUNTER}"
    exit 0
fi
exit 2
`,
		);

		const clean = await execFileAsync("bash", [SCRIPT], { cwd, env });
		assert.match(clean.stdout, /deploy-relevant Next build passed/);
		assert.match(clean.stdout, /QG_PUBLISH_PROOF_WRITTEN/);
		assert.equal(
			(await readFile(gateCounter, "utf8")).trim().split("\n").length,
			2,
		);
		assert.equal(
			(await readFile(buildCounter, "utf8")).trim().split("\n").length,
			2,
		);

		const reused = await execFileAsync("bash", [SCRIPT], { cwd, env });
		assert.match(reused.stdout, /QG_PUBLISH_PROOF_REUSED/);
		assert.equal(
			(await readFile(gateCounter, "utf8")).trim().split("\n").length,
			2,
		);
		assert.equal(
			(await readFile(buildCounter, "utf8")).trim().split("\n").length,
			2,
		);
	} finally {
		await rm(cwd, { recursive: true, force: true });
	}
});
