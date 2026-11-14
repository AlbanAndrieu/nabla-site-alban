import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import {
	decideReuse,
	normalizePaths,
	openPullRequests,
	parseArgs,
} from "../scripts/agent-pr-guard.mjs";

const A = "a".repeat(40);
const B = "b".repeat(40);
const pr = (number, branch, paths, head = A) => ({
	number,
	branch,
	paths,
	head,
	repo: "AlbanAndrieu/nabla-site-alban",
	base: "master",
});

test("scope is explicit, bounded and normalized", () => {
	assert.deepEqual(
		parseArgs([
			"--paths",
			"AGENTS.md",
			"docs/quality-roadmap.md",
			"--pr",
			"307",
			"--expected-head",
			A,
		]),
		{
			paths: ["AGENTS.md", "docs/quality-roadmap.md"],
			current: 307,
			expectedHead: A,
			help: false,
		},
	);
	assert.deepEqual(normalizePaths(["b", "a", "a"]), ["a", "b"]);
	for (const path of [
		"/etc/passwd",
		"a/../b",
		"a//b",
		"a/./b",
		"a\\b",
		"a\nsecret",
	]) {
		assert.throws(() => normalizePaths([path]), /PR_GUARD_INVALID_PATH/);
	}
	assert.throws(() => parseArgs(["--paths"]), /PR_GUARD_PATHS_REQUIRED/);
	assert.throws(() => parseArgs(["--unknown"]), /PR_GUARD_INVALID_ARGUMENT/);
	assert.throws(() => decideReuse([], []), /PR_GUARD_SCOPE_EMPTY/);
});

test("reuse an open PR with overlapping planned files", () => {
	const decision = decideReuse(
		["AGENTS.md"],
		[pr(307, "docs/agents", ["AGENTS.md"])],
		{ branch: "master" },
	);
	assert.equal(decision.kind, "REUSE");
	assert.deepEqual(decision.overlaps[0].paths, ["AGENTS.md"]);
	assert.equal(decideReuse(["new-file"], [], {}).kind, "NO_MATCH");
});

test("continue only a currently open PR with pinned HEAD and base", () => {
	const existing = [pr(307, "fix/agents", ["AGENTS.md"])];
	assert.equal(
		decideReuse(["AGENTS.md"], existing, {
			current: 307,
			branch: "fix/agents",
			expectedHead: A,
		}).kind,
		"CONTINUE",
	);
	assert.equal(
		decideReuse(["AGENTS.md"], existing, {
			branch: "fix/agents",
			trackingHead: A,
		}).kind,
		"CONTINUE",
	);
	assert.throws(
		() =>
			decideReuse(["AGENTS.md"], existing, {
				current: 307,
				branch: "fix/agents",
			}),
		/PR_GUARD_HEAD_NOT_PINNED/,
	);
	assert.throws(
		() =>
			decideReuse(["AGENTS.md"], existing, { current: 307, expectedHead: B }),
		/PR_GUARD_HEAD_CHANGED/,
	);
	assert.throws(
		() =>
			decideReuse(["AGENTS.md"], existing, {
				current: 307,
				branch: "wrong",
				expectedHead: A,
			}),
		/PR_GUARD_BRANCH_MISMATCH/,
	);
	assert.throws(
		() =>
			decideReuse(["AGENTS.md"], [{ ...existing[0], baseSha: A }], {
				current: 307,
				localBase: B,
				expectedHead: A,
			}),
		/PR_GUARD_BASE_STALE/,
	);
});

test("conflicting open PRs block parallel writes", () => {
	const prs = [
		pr(307, "fix/agents", ["AGENTS.md"]),
		pr(308, "fix/quality", ["AGENTS.md", "justfile"]),
	];
	assert.equal(decideReuse(["AGENTS.md"], prs, {}).kind, "CONFLICT");
	const decision = decideReuse(["AGENTS.md", "scripts/ci-scope.sh"], prs, {
		current: 307,
		branch: "fix/agents",
		expectedHead: A,
	});
	assert.equal(decision.kind, "CONFLICT");
	assert.deepEqual(
		decision.overlaps.map((x) => x.number),
		[307, 308],
	);
});

test("merged PRs and fork PRs cannot silently become writable branches", () => {
	assert.throws(
		() => decideReuse(["AGENTS.md"], [], { current: 306, expectedHead: A }),
		/PR_GUARD_PR_NOT_OPEN/,
	);
	assert.equal(
		decideReuse(
			["AGENTS.md"],
			[{ ...pr(307, "fork", ["AGENTS.md"]), repo: "other/fork" }],
			{},
		).kind,
		"CONFLICT",
	);
	assert.equal(
		decideReuse(
			["AGENTS.md"],
			[{ ...pr(307, "unverified", ["AGENTS.md"]), repo: "UNVERIFIED" }],
			{},
		).kind,
		"CONFLICT",
	);
	assert.throws(
		() =>
			decideReuse(
				["AGENTS.md"],
				[{ ...pr(307, "fork", ["AGENTS.md"]), repo: "other/fork" }],
				{
					current: 307,
					expectedHead: A,
				},
			),
		/PR_GUARD_EXTERNAL_HEAD/,
	);
});

test("API pages include old and new paths for renamed files", async () => {
	const calls = [];
	const rows = await openPullRequests(async (endpoint) => {
		calls.push(endpoint);
		if (endpoint.includes("state=open"))
			return [
				{
					number: 307,
					head: {
						ref: "feature",
						sha: A,
						repo: { full_name: "AlbanAndrieu/nabla-site-alban" },
					},
					base: { ref: "master", sha: B },
				},
			];
		return [{ filename: "new.ts", previous_filename: "old.ts" }];
	});
	assert.equal(calls.length, 2);
	assert.deepEqual(rows[0].paths, ["new.ts", "old.ts"]);
	assert.equal(rows[0].baseSha, B);
});

test("help mode executes without gh, Git network, or dependencies", () => {
	const output = execFileSync(
		process.execPath,
		[
			new URL("../scripts/agent-pr-guard.mjs", import.meta.url).pathname,
			"--help",
		],
		{
			encoding: "utf8",
		},
	);
	assert.match(output, /--paths FILE/);
	assert.match(output, /Read-only/);
});
