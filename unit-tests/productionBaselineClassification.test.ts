import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const classificationScript = fileURLToPath(
	new URL(
		"../scripts/lib/production-baseline-classification.sh",
		import.meta.url,
	),
);

function git(cwd: string, ...args: string[]) {
	return execFileSync("git", args, {
		cwd,
		encoding: "utf8",
		stdio: ["ignore", "pipe", "pipe"],
	}).trim();
}

async function writeJson(pathname: string, value: unknown) {
	await mkdir(dirname(pathname), { recursive: true });
	await writeFile(pathname, JSON.stringify(value, null, 2) + "\n");
}

async function createRepository() {
	const cwd = await mkdtemp(
		join(tmpdir(), "alban-production-baseline-classifier-"),
	);
	git(cwd, "init", "--quiet");
	git(cwd, "config", "user.email", "baseline-classifier@example.invalid");
	git(cwd, "config", "user.name", "Baseline Classifier Test");

	await writeJson(join(cwd, "package.json"), {
		name: "fixture",
		version: "1.0.0",
		private: true,
	});
	await writeJson(join(cwd, "package-lock.json"), {
		name: "fixture",
		version: "1.0.0",
		lockfileVersion: 3,
		packages: { "": { name: "fixture", version: "1.0.0" } },
	});
	git(cwd, "add", ".");
	git(cwd, "commit", "--quiet", "-m", "base");
	return cwd;
}

function classify(
	cwd: string,
	functionName: string,
	parent: string,
	child: string,
) {
	return spawnSync(
		"bash",
		[
			"-c",
			'source "$1"; "$2" "$3" "$4"',
			"bash",
			classificationScript,
			functionName,
			parent,
			child,
		],
		{ cwd, encoding: "utf8" },
	);
}

test("release classification accepts only reviewed semantic-release metadata", async (t) => {
	const cwd = await createRepository();
	t.after(async () => rm(cwd, { recursive: true, force: true }));
	const parent = git(cwd, "rev-parse", "HEAD");

	await writeJson(join(cwd, "package.json"), {
		name: "fixture",
		version: "1.0.1",
		private: true,
	});
	await writeJson(join(cwd, "package-lock.json"), {
		name: "fixture",
		version: "1.0.1",
		lockfileVersion: 3,
		packages: { "": { name: "fixture", version: "1.0.1" } },
	});
	await writeFile(join(cwd, "CHANGELOG.md"), "# 1.0.1\n");
	git(cwd, "add", ".");
	git(cwd, "commit", "--quiet", "-m", "chore(release): 1.0.1 [skip ci]");
	const release = git(cwd, "rev-parse", "HEAD");

	const accepted = classify(cwd, "release_only_hop", parent, release);
	assert.equal(accepted.status, 0, accepted.stderr);
	assert.match(accepted.stdout, /accepted semantic-release metadata hop/);

	await writeFile(join(cwd, "runtime.txt"), "runtime change\n");
	git(cwd, "add", "runtime.txt");
	git(cwd, "commit", "--quiet", "-m", "chore(release): 1.0.2 [skip ci]");
	const invalid = classify(
		cwd,
		"release_only_hop",
		release,
		git(cwd, "rev-parse", "HEAD"),
	);
	assert.equal(invalid.status, 1);
	assert.match(invalid.stderr, /PROD_BASE_RELEASE_SCOPE/);
});

test("maintenance classification accepts reviewed paths and rejects runtime paths", async (t) => {
	const cwd = await createRepository();
	t.after(async () => rm(cwd, { recursive: true, force: true }));
	const parent = git(cwd, "rev-parse", "HEAD");

	await mkdir(join(cwd, "docs"), { recursive: true });
	await writeFile(join(cwd, "docs/notes.md"), "maintenance\n");
	git(cwd, "add", ".");
	git(cwd, "commit", "--quiet", "-m", "docs: maintenance");
	const maintenance = git(cwd, "rev-parse", "HEAD");

	const accepted = classify(cwd, "maintenance_only_hop", parent, maintenance);
	assert.equal(accepted.status, 0, accepted.stderr);
	assert.match(accepted.stdout, /accepted maintenance-only baseline hop/);

	await mkdir(join(cwd, "scripts/lib"), { recursive: true });
	await writeFile(
		join(cwd, "scripts/lib/production-baseline-classification.sh"),
		"# classification maintenance\n",
	);
	git(cwd, "add", ".");
	git(cwd, "commit", "--quiet", "-m", "refactor: baseline classifier");
	const classifierMaintenance = git(cwd, "rev-parse", "HEAD");
	const classifierAccepted = classify(
		cwd,
		"maintenance_only_hop",
		maintenance,
		classifierMaintenance,
	);
	assert.equal(classifierAccepted.status, 0, classifierAccepted.stderr);

	await mkdir(join(cwd, "app"), { recursive: true });
	await writeFile(
		join(cwd, "app/runtime.ts"),
		"export const runtime = true;\n",
	);
	git(cwd, "add", ".");
	git(cwd, "commit", "--quiet", "-m", "feat: runtime");
	const runtime = git(cwd, "rev-parse", "HEAD");

	const rejected = classify(
		cwd,
		"maintenance_only_hop",
		classifierMaintenance,
		runtime,
	);
	assert.equal(rejected.status, 1);
	assert.match(rejected.stderr, /PROD_BASE_MAINTENANCE_SCOPE/);
});
