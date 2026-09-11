import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import test from "node:test";

const execFileAsync = promisify(execFile);
const SCRIPT = fileURLToPath(new URL("../scripts/ci-scope.sh", import.meta.url));

async function git(cwd: string, ...args: string[]): Promise<string> {
	const { stdout } = await execFileAsync("git", args, { cwd });
	return stdout.trim();
}

async function commitAll(cwd: string, message: string): Promise<string> {
	await git(cwd, "add", "-A");
	await git(cwd, "commit", "-m", message);
	return git(cwd, "rev-parse", "HEAD");
}

test("CI scope classifier only skips application work for narrow agent/quality maintenance", async () => {
	const cwd = await mkdtemp(path.join(os.tmpdir(), "nabla-ci-scope-"));
	try {
		await git(cwd, "init");
		await git(cwd, "config", "user.email", "ci-scope@example.invalid");
		await git(cwd, "config", "user.name", "CI Scope Test");
		await writeFile(path.join(cwd, "AGENTS.md"), "base\n");
		const base = await commitAll(cwd, "base");

		await mkdir(path.join(cwd, "scripts"), { recursive: true });
		await writeFile(
			path.join(cwd, "scripts/agent-quality-gate.sh"),
			"#!/usr/bin/env bash\necho maintenance\n",
		);
		const maintenanceHead = await commitAll(cwd, "maintenance");
		const maintenance = await execFileAsync("bash", [SCRIPT, base, maintenanceHead], {
			cwd,
		});
		assert.match(maintenance.stdout, /maintenance_only=true/);
		assert.match(maintenance.stdout, /sast=false/);
		assert.match(maintenance.stdout, /build=false/);

		await mkdir(path.join(cwd, "app"), { recursive: true });
		await writeFile(path.join(cwd, "app/page.tsx"), "export default function Page() {}\n");
		const applicationHead = await commitAll(cwd, "application");
		const application = await execFileAsync(
			"bash",
			[SCRIPT, maintenanceHead, applicationHead],
			{ cwd },
		);
		assert.match(application.stdout, /maintenance_only=false/);
		assert.match(application.stdout, /sast=true/);
		assert.match(application.stdout, /build=true/);
	} finally {
		await rm(cwd, { recursive: true, force: true });
	}
});
