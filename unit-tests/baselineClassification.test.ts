import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const classificationScript = fileURLToPath(
	new URL("../scripts/lib/baseline-classification.sh", import.meta.url),
);

function git(cwd: string, ...args: string[]) {
	return execFileSync("git", args, {
		cwd,
		encoding: "utf8",
		stdio: ["ignore", "pipe", "pipe"],
	}).trim();
}

// macOS file systems treat NFD and NFC names as the same file, so Unicode
// renames are staged directly in the index to stay byte-exact on every OS.
function renameInIndex(cwd: string, oldName: string, newName: string) {
	const [mode, blob] = git(cwd, "ls-files", "--stage", "--", oldName).split(
		/\s+/,
	);
	git(cwd, "rm", "--cached", "--quiet", "--", oldName);
	git(
		cwd,
		"update-index",
		"--add",
		"--cacheinfo",
		`${mode},${blob},${newName}`,
	);
}

function writeIndexBlob(cwd: string, pathname: string, content: string) {
	const blob = execFileSync("git", ["hash-object", "-w", "--stdin"], {
		cwd,
		encoding: "utf8",
		input: content,
	}).trim();
	git(
		cwd,
		"update-index",
		"--add",
		"--cacheinfo",
		`100644,${blob},${pathname}`,
	);
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
	git(cwd, "config", "core.precomposeunicode", "false");

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
		join(cwd, "scripts/lib/baseline-classification.sh"),
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

test("maintenance classification permits only the byte-identical macOS Unicode PDF rename", async (t) => {
	const cwd = await createRepository();
	t.after(async () => rm(cwd, { recursive: true, force: true }));
	const oldName = "public/cv/kleta/Dossier de compétences - Sécurité.pdf";
	const newName = oldName.normalize("NFC");
	assert.notEqual(oldName, newName);
	await mkdir(dirname(join(cwd, oldName)), { recursive: true });
	await writeFile(join(cwd, oldName), "identical pdf bytes");
	git(cwd, "add", ".");
	git(cwd, "commit", "--quiet", "-m", "add old name");
	const parent = git(cwd, "rev-parse", "HEAD");

	renameInIndex(cwd, oldName, newName);
	git(cwd, "commit", "--quiet", "-m", "normalize filename");
	const renameCommit = git(cwd, "rev-parse", "HEAD");
	const accepted = classify(cwd, "maintenance_only_hop", parent, renameCommit);
	assert.equal(accepted.status, 0, accepted.stderr);

	writeIndexBlob(cwd, newName, "changed pdf bytes");
	git(cwd, "commit", "--quiet", "-m", "change pdf");
	const modified = classify(
		cwd,
		"maintenance_only_hop",
		renameCommit,
		git(cwd, "rev-parse", "HEAD"),
	);
	assert.equal(modified.status, 1);
	assert.match(modified.stderr, /PROD_BASE_MAINTENANCE_SCOPE/);
});

test("a byte-identical PDF rename never hides deployable changes in the same commit", async (t) => {
	const cwd = await createRepository();
	t.after(async () => rm(cwd, { recursive: true, force: true }));
	const oldName = "public/cv/kleta/cv-é.pdf";
	const newName = oldName.normalize("NFC");
	await mkdir(dirname(join(cwd, oldName)), { recursive: true });
	await writeFile(join(cwd, oldName), "original");
	git(cwd, "add", ".");
	git(cwd, "commit", "--quiet", "-m", "fixture PDF");
	const parent = git(cwd, "rev-parse", "HEAD");
	renameInIndex(cwd, oldName, newName);
	await mkdir(join(cwd, "app"), { recursive: true });
	await writeFile(
		join(cwd, "app/page.tsx"),
		"export default function Page() { return null; }",
	);
	git(cwd, "add", "app/page.tsx");
	git(cwd, "commit", "--quiet", "-m", "filename normalization and new page");
	const rejected = classify(
		cwd,
		"maintenance_only_hop",
		parent,
		git(cwd, "rev-parse", "HEAD"),
	);
	assert.equal(rejected.status, 1);
	assert.match(rejected.stderr, /PROD_BASE_MAINTENANCE_SCOPE/);
	assert.match(rejected.stderr, /app\/page\.tsx/);
});
