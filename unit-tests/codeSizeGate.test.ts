import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const script = join(repositoryRoot, "scripts/check_code_size.py");

function runCodeSize(...args: string[]) {
	return spawnSync("python3", [script, ...args], {
		cwd: repositoryRoot,
		encoding: "utf8",
	});
}

test("code-size gate warns without failing between soft and hard limits", async () => {
	const directory = await mkdtemp(join(tmpdir(), "site-code-size-"));
	const source = join(directory, "warning.ts");
	try {
		await writeFile(source, "one\ntwo\nthree\nfour\n", "utf8");
		const result = runCodeSize("--warn", "3", "--fail", "5", source);

		assert.equal(result.status, 0, result.stderr);
		assert.match(result.stderr, /WARNING .*warning\.ts: 4 lines exceeds 3/);
		assert.match(result.stdout, /1 warning\(s\), 0 error\(s\)/);
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
});

test("code-size gate fails a new source file above the hard limit", async () => {
	const directory = await mkdtemp(join(tmpdir(), "site-code-size-"));
	const source = join(directory, "oversized.ts");
	try {
		await writeFile(source, "one\ntwo\nthree\nfour\nfive\nsix\n", "utf8");
		const result = runCodeSize("--warn", "3", "--fail", "5", source);

		assert.equal(result.status, 1);
		assert.match(result.stderr, /ERROR .*oversized\.ts: 6 lines exceeds 5/);
		assert.match(result.stdout, /0 warning\(s\), 1 error\(s\)/);
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
});

test("code-size gate grandfathers an already oversized baseline file", () => {
	const result = runCodeSize(
		"--warn",
		"2",
		"--fail",
		"3",
		"--baseline-ref",
		"HEAD",
		"scripts/agent-quality-gate.sh",
	);

	assert.equal(result.status, 0, result.stderr);
	assert.match(result.stderr, /baseline \d+, legacy limit \d+/);
	assert.match(result.stdout, /1 warning\(s\), 0 error\(s\)/);
});

test("agent quality gate invokes the baseline-aware code-size report", async () => {
	const { readFile } = await import("node:fs/promises");
	const agentGate = await readFile(
		join(repositoryRoot, "scripts/agent-quality-gate.sh"),
		"utf8",
	);

	assert.match(agentGate, /python3 scripts\/check_code_size\.py/);
	assert.match(agentGate, /--baseline-ref "\$\{BASE_REF\}"/);
	assert.match(agentGate, /"\$\{CHANGED_FILES\[@\]\}"/);
});
