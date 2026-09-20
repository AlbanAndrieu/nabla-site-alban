import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const checkpointScript = fileURLToPath(
	new URL("../scripts/publish-vercel-preview-checkpoint.sh", import.meta.url),
);

type Fixture = {
	directory: string;
	baseSha: string;
	headSha: string;
};

function git(cwd: string, ...args: string[]) {
	return execFileSync("git", args, {
		cwd,
		encoding: "utf8",
		stdio: ["ignore", "pipe", "pipe"],
	}).trim();
}

async function createFixture(): Promise<Fixture> {
	const directory = await mkdtemp(join(tmpdir(), "alban-vercel-checkpoint-"));
	const remote = join(directory, "remote.git");
	const work = join(directory, "work");

	execFileSync("git", ["init", "--bare", "--quiet", remote]);
	execFileSync("git", ["init", "--quiet", work]);
	git(work, "config", "user.email", "checkpoint-test@example.invalid");
	git(work, "config", "user.name", "Checkpoint Test");

	await writeFile(join(work, "fixture.txt"), "base\n", "utf8");
	git(work, "add", "fixture.txt");
	git(work, "commit", "--quiet", "-m", "base");
	const baseSha = git(work, "rev-parse", "HEAD");

	await writeFile(join(work, "fixture.txt"), "base\nhead\n", "utf8");
	git(work, "commit", "--quiet", "-am", "head");
	const headSha = git(work, "rev-parse", "HEAD");

	git(work, "remote", "add", "origin", remote);
	git(work, "push", "--quiet", "origin", `${baseSha}:refs/heads/master`);

	return { directory, baseSha, headSha };
}

function checkpoint(cwd: string, ...args: string[]) {
	return execFileSync("bash", [checkpointScript, ...args], {
		cwd,
		encoding: "utf8",
		stdio: ["ignore", "pipe", "pipe"],
	}).trim();
}

test("publishes an exact-SHA checkpoint and replays idempotently", async (t) => {
	const fixture = await createFixture();
	t.after(async () => {
		await rm(fixture.directory, { recursive: true, force: true });
	});
	const work = join(fixture.directory, "work");

	const first = checkpoint(
		work,
		"vercel-preview-pr-192",
		fixture.baseSha,
		fixture.headSha,
	);
	assert.match(first, /Published vercel-preview-pr-192/);
	assert.equal(
		git(work, "ls-remote", "origin", "refs/heads/vercel-preview-pr-192").split(
			"\t",
		)[0],
		fixture.headSha,
	);

	const replay = checkpoint(
		work,
		"vercel-preview-pr-192",
		fixture.baseSha,
		fixture.headSha,
	);
	assert.match(replay, /already points to/);
});

test("rejects unsafe branch names and stale base/head relationships", async (t) => {
	const fixture = await createFixture();
	t.after(async () => {
		await rm(fixture.directory, { recursive: true, force: true });
	});
	const work = join(fixture.directory, "work");

	const invalidName = spawnSync(
		"bash",
		[checkpointScript, "preview-192", fixture.baseSha, fixture.headSha],
		{ cwd: work, encoding: "utf8" },
	);
	assert.equal(invalidName.status, 2);
	assert.match(invalidName.stderr, /invalid checkpoint branch/);

	const stale = spawnSync(
		"bash",
		[
			checkpointScript,
			"vercel-preview-pr-192",
			fixture.headSha,
			fixture.baseSha,
		],
		{ cwd: work, encoding: "utf8" },
	);
	assert.equal(stale.status, 1);
	assert.match(stale.stderr, /does not contain base/);
});
