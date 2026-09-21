import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const SCRIPT = fileURLToPath(
	new URL("../scripts/ci-scope.sh", import.meta.url),
);

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
		const maintenance = await execFileAsync(
			"bash",
			[SCRIPT, base, maintenanceHead],
			{
				cwd,
			},
		);
		assert.match(maintenance.stdout, /maintenance_only=true/);
		assert.match(maintenance.stdout, /sast=false/);
		assert.match(maintenance.stdout, /build=false/);
		assert.match(maintenance.stdout, /preview_required=false/);

		await mkdir(path.join(cwd, "docs"), { recursive: true });
		await mkdir(path.join(cwd, "unit-tests"), { recursive: true });
		await writeFile(path.join(cwd, "docs/quality.md"), "docs only\n");
		await writeFile(
			path.join(cwd, "unit-tests/quality.test.ts"),
			"export const maintenanceOnly = true;\n",
		);
		const docsAndTestsHead = await commitAll(cwd, "docs and unit tests");
		const docsAndTests = await execFileAsync(
			"bash",
			[SCRIPT, maintenanceHead, docsAndTestsHead],
			{ cwd },
		);
		assert.match(docsAndTests.stdout, /maintenance_only=true/);
		assert.match(docsAndTests.stdout, /application=false/);
		assert.match(docsAndTests.stdout, /sast=false/);
		assert.match(docsAndTests.stdout, /build=false/);
		assert.match(docsAndTests.stdout, /preview_required=false/);

		await mkdir(path.join(cwd, ".github/workflows"), { recursive: true });
		await writeFile(
			path.join(cwd, ".github/workflows/ci.yml"),
			"name: Security-sensitive workflow\n",
		);
		const workflowHead = await commitAll(cwd, "workflow change");
		const workflow = await execFileAsync(
			"bash",
			[SCRIPT, docsAndTestsHead, workflowHead],
			{ cwd },
		);
		assert.match(workflow.stdout, /maintenance_only=false/);
		assert.match(workflow.stdout, /application=true/);
		assert.match(workflow.stdout, /sast=true/);
		assert.match(workflow.stdout, /build=true/);
		assert.match(workflow.stdout, /preview_required=false/);

		await mkdir(path.join(cwd, "scripts/lib"), { recursive: true });
		await writeFile(
			path.join(
				cwd,
				"scripts/lib/production-baseline-classification.sh",
			),
			"# policy-only classifier\n",
		);
		const classifierHead = await commitAll(cwd, "classifier policy");
		const classifier = await execFileAsync(
			"bash",
			[SCRIPT, workflowHead, classifierHead],
			{ cwd },
		);
		assert.match(classifier.stdout, /maintenance_only=false/);
		assert.match(classifier.stdout, /application=true/);
		assert.match(classifier.stdout, /sast=true/);
		assert.match(classifier.stdout, /build=true/);
		assert.match(classifier.stdout, /preview_required=false/);

		await mkdir(path.join(cwd, "app"), { recursive: true });
		await writeFile(
			path.join(cwd, "app/page.tsx"),
			"export default function Page() {}\n",
		);
		const applicationHead = await commitAll(cwd, "application");
		const application = await execFileAsync(
			"bash",
			[SCRIPT, classifierHead, applicationHead],
			{ cwd },
		);
		assert.match(application.stdout, /maintenance_only=false/);
		assert.match(application.stdout, /sast=true/);
		assert.match(application.stdout, /build=true/);
		assert.match(application.stdout, /preview_required=true/);
	} finally {
		await rm(cwd, { recursive: true, force: true });
	}
});
