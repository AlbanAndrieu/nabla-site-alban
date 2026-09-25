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
		await makeExecutable(
			path.join(cwd, "scripts/ci-scope.sh"),
			`#!/usr/bin/env bash\nset -euo pipefail\nif git diff --name-only "\$1" "\$2" | grep -q '^app/'; then printf '%s\\n' 'build=true'; else printf '%s\\n' 'build=false'; fi\n`,
		);
		await git(
			cwd,
			"add",
			"scripts/agent-quality-gate.sh",
			"scripts/ci-scope.sh",
		);
		await git(cwd, "commit", "-m", "head");

		const counter = path.join(cwd, ".git", "gate-count.txt");
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
		const buildCounter = path.join(cwd, ".git", "build-count.txt");
		await makeExecutable(
			path.join(bin, "npm"),
			`#!/usr/bin/env bash\nset -euo pipefail\nif [[ "\${1:-}" == "--version" ]]; then printf '%s\\n' '11.17.0'; exit 0; fi\nif [[ "\${1:-}" == "run" && "\${2:-}" == "build" ]]; then printf '1\\n' >> "\${QUALITY_TEST_BUILD_COUNTER}"; exit 0; fi\nexit 2\n`,
		);
		const env = {
			...process.env,
			PATH: `${bin}:${process.env.PATH ?? ""}`,
			QUALITY_BASE_REF: "",
			QUALITY_TEST_COUNTER: counter,
			QUALITY_TEST_BUILD_COUNTER: buildCounter,
		};

		await assert.rejects(
			execFileAsync("bash", [SCRIPT, "--status"], { cwd, env }),
			(error: unknown) =>
				Boolean(
					error &&
						typeof error === "object" &&
						"stderr" in error &&
						String((error as { stderr: unknown }).stderr).includes(
							"QG_PUBLISH_PROOF_MISSING",
						),
				),
		);

		const first = await execFileAsync("bash", [SCRIPT], { cwd, env });
		assert.match(first.stdout, /Next build intentionally skipped/);
		assert.match(first.stdout, /QG_PUBLISH_PROOF_WRITTEN/);
		await assert.rejects(readFile(buildCounter, "utf8"));
		const status = await execFileAsync("bash", [SCRIPT, "--status"], {
			cwd,
			env,
		});
		assert.match(status.stdout, /QG_PUBLISH_PROOF_OK/);
		assert.match(
			status.stdout,
			new RegExp(`head=${await git(cwd, "rev-parse", "HEAD")}`),
		);
		assert.match(
			status.stdout,
			new RegExp(`base=${await git(cwd, "rev-parse", "HEAD~1")}`),
		);
		assert.match(status.stdout, /toolchain_sha=[0-9a-f]{64}/);
		assert.match(status.stdout, /node=v26\.8\.2/);
		assert.match(status.stdout, /npm=11\.17\.0/);
		assert.match(status.stdout, /python=Python 3\.13\.15/);
		assert.match(status.stdout, /pre-commit=pre-commit 4\.6\.2/);

		const second = await execFileAsync("bash", [SCRIPT], { cwd, env });
		assert.match(second.stdout, /QG_PUBLISH_PROOF_REUSED/);
		assert.equal(
			(await readFile(counter, "utf8")).trim().split("\n").length,
			1,
		);

		await rm(path.join(bin, "pre-commit"));
		const missingToolEnv = {
			...env,
			PATH: `${bin}:/usr/bin:/bin`,
		};
		await assert.rejects(
			execFileAsync("bash", [SCRIPT], { cwd, env: missingToolEnv }),
			(error: unknown) =>
				Boolean(
					error &&
						typeof error === "object" &&
						"stderr" in error &&
						String((error as { stderr: unknown }).stderr).includes(
							"QG_PUBLISH_TOOL_MISSING",
						),
				),
		);
		assert.equal(
			(await readFile(counter, "utf8")).trim().split("\n").length,
			1,
		);
		await makeExecutable(
			path.join(bin, "pre-commit"),
			"#!/usr/bin/env bash\nprintf '%s\\n' 'pre-commit 4.6.2'\n",
		);

		await makeExecutable(
			path.join(bin, "node"),
			"#!/usr/bin/env bash\nexit 42\n",
		);
		await assert.rejects(
			execFileAsync("bash", [SCRIPT], { cwd, env }),
			(error: unknown) =>
				Boolean(
					error &&
						typeof error === "object" &&
						"stderr" in error &&
						String((error as { stderr: unknown }).stderr).includes(
							"QG_PUBLISH_TOOL_INVALID",
						),
				),
		);
		await makeExecutable(
			path.join(bin, "node"),
			"#!/usr/bin/env bash\nprintf '%s\\n' 'v26.8.2'\n",
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
		await assert.rejects(
			execFileAsync("bash", [SCRIPT, "--status"], { cwd, env }),
			(error: unknown) =>
				Boolean(
					error &&
						typeof error === "object" &&
						"stderr" in error &&
						String((error as { stderr: unknown }).stderr).includes(
							"QG_PUBLISH_PROOF_STALE",
						),
				),
		);
		const third = await execFileAsync("bash", [SCRIPT], { cwd, env });
		assert.match(third.stdout, /QG_PUBLISH_PROOF_WRITTEN/);
		assert.equal(
			(await readFile(counter, "utf8")).trim().split("\n").length,
			2,
		);

		await mkdir(path.join(cwd, "app"), { recursive: true });
		await writeFile(
			path.join(cwd, "app/page.tsx"),
			"export default function Page() {}\n",
		);
		await git(cwd, "add", "app/page.tsx");
		await git(cwd, "commit", "-m", "deployable-head");
		const fourth = await execFileAsync("bash", [SCRIPT], { cwd, env });
		assert.match(fourth.stdout, /deploy-relevant Next build passed/);
		assert.match(fourth.stdout, /QG_PUBLISH_PROOF_WRITTEN/);
		assert.equal(
			(await readFile(counter, "utf8")).trim().split("\n").length,
			3,
		);
		assert.equal(
			(await readFile(buildCounter, "utf8")).trim().split("\n").length,
			1,
		);
	} finally {
		await rm(cwd, { recursive: true, force: true });
	}
});
