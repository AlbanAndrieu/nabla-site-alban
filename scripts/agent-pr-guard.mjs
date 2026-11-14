#!/usr/bin/env node
/** Read-only, fail-closed PR ownership and file-overlap check. No pushes, CI or retries. */
import { execFile, spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = "AlbanAndrieu/nabla-site-alban";
const MAX_PRS = 40;
const MAX_FILES = 300;
const exec = promisify(execFile);
const error = (code) => Object.assign(new Error(code), { code });

export function normalizePaths(paths) {
	const normalized = paths.map((path) => {
		if (
			typeof path !== "string" ||
			!path ||
			path.startsWith("/") ||
			path.includes("\\") ||
			/[\r\n\0]/.test(path) ||
			path.split("/").some((part) => !part || part === ".." || part === ".")
		)
			throw error("PR_GUARD_INVALID_PATH");
		return path;
	});
	const result = [...new Set(normalized)].sort();
	if (result.length > MAX_FILES) throw error("PR_GUARD_SCOPE_TOO_LARGE");
	return result;
}

export function parseArgs(argv) {
	const args = { paths: [], current: null, expectedHead: null, help: false };
	for (let i = 0; i < argv.length; i++) {
		const value = argv[i];
		if (value === "--help") {
			args.help = true;
			continue;
		}
		if (value === "--paths") {
			while (i + 1 < argv.length && !argv[i + 1].startsWith("--"))
				args.paths.push(argv[++i]);
			if (!args.paths.length) throw error("PR_GUARD_PATHS_REQUIRED");
		} else if (value === "--pr" && /^[0-9]+$/.test(argv[i + 1] ?? "")) {
			if (args.current !== null) throw error("PR_GUARD_DUPLICATE_ARGUMENT");
			args.current = Number(argv[++i]);
			if (!Number.isSafeInteger(args.current) || args.current < 1)
				throw error("PR_GUARD_INVALID_ARGUMENT");
		} else if (
			value === "--expected-head" &&
			/^[a-f0-9]{40}$/i.test(argv[i + 1] ?? "")
		) {
			if (args.expectedHead) throw error("PR_GUARD_DUPLICATE_ARGUMENT");
			args.expectedHead = argv[++i].toLowerCase();
		} else throw error("PR_GUARD_INVALID_ARGUMENT");
	}
	return args;
}

function git(args) {
	const result = spawnSync("git", args, {
		cwd: ROOT,
		encoding: "utf8",
		timeout: 5000,
		maxBuffer: 1_000_000,
	});
	return result.status === 0 ? result.stdout.trim() : null;
}

function gitScope() {
	const base = git(["rev-parse", "--verify", "origin/master^{commit}"]);
	if (!base) throw error("PR_GUARD_BASE_MISSING");
	const commands = [
		["diff", "--no-renames", "--name-only", "-z", "origin/master...HEAD"],
		["diff", "--no-renames", "--name-only", "-z"],
		["diff", "--cached", "--no-renames", "--name-only", "-z"],
		["ls-files", "--others", "--exclude-standard", "-z"],
	];
	const paths = [];
	for (const args of commands) {
		const result = spawnSync("git", args, {
			cwd: ROOT,
			encoding: "utf8",
			timeout: 5000,
			maxBuffer: 1_000_000,
		});
		if (result.status !== 0) throw error("PR_GUARD_GIT_DIFF_FAILED");
		paths.push(...result.stdout.split("\0").filter(Boolean));
	}
	return normalizePaths(paths);
}

async function api(endpoint) {
	try {
		const { stdout } = await exec("gh", ["api", endpoint], {
			cwd: ROOT,
			encoding: "utf8",
			timeout: 15000,
			maxBuffer: 2_000_000,
		});
		return JSON.parse(stdout);
	} catch {
		// Never echo gh stderr: it may contain private URLs or credentials.
		throw error("PR_GUARD_GITHUB_UNAVAILABLE");
	}
}

async function readPages(endpoint, limit) {
	const result = [];
	for (let page = 1; page <= Math.ceil(limit / 100) + 1; page++) {
		const separator = endpoint.includes("?") ? "&" : "?";
		const rows = await api(endpoint + separator + "per_page=100&page=" + page);
		if (!Array.isArray(rows)) throw error("PR_GUARD_GITHUB_RESPONSE_INVALID");
		result.push(...rows);
		if (result.length > limit) throw error("PR_GUARD_GITHUB_LIMIT");
		if (rows.length < 100) return result;
	}
	throw error("PR_GUARD_GITHUB_LIMIT");
}

export async function openPullRequests(pages = readPages) {
	const prs = await pages("repos/" + REPO + "/pulls?state=open", MAX_PRS);
	const result = [];
	for (let i = 0; i < prs.length; i += 4) {
		const batch = await Promise.all(
			prs.slice(i, i + 4).map(async (pr) => {
				if (
					!Number.isInteger(pr.number) ||
					!pr.head?.sha ||
					!pr.head?.ref ||
					!pr.base?.ref
				)
					throw error("PR_GUARD_GITHUB_RESPONSE_INVALID");
				const files = await pages(
					"repos/" + REPO + "/pulls/" + pr.number + "/files",
					MAX_FILES,
				);
				const paths = normalizePaths(
					files.flatMap((file) =>
						[file.filename, file.previous_filename].filter(Boolean),
					),
				);
				return {
					number: pr.number,
					branch: pr.head.ref,
					head: pr.head.sha,
					repo: pr.head.repo?.full_name ?? "UNVERIFIED",
					base: pr.base.ref,
					baseSha: pr.base.sha ?? null,
					paths,
				};
			}),
		);
		result.push(...batch);
	}
	return result;
}

/** Pure, deterministic selection. Never silently reuse a merged or foreign PR. */
export function decideReuse(
	scope,
	prs,
	{
		current = null,
		branch = null,
		expectedHead = null,
		trackingHead = null,
		localBase = null,
	} = {},
) {
	const requested = normalizePaths(scope);
	if (!requested.length) throw error("PR_GUARD_SCOPE_EMPTY");
	const selected =
		current !== null
			? prs.find((pr) => pr.number === current)
			: prs.find(
					(pr) =>
						branch && pr.branch === branch && (!pr.repo || pr.repo === REPO),
				);
	if (current !== null && !selected) throw error("PR_GUARD_PR_NOT_OPEN");
	if (selected?.repo && selected.repo !== REPO)
		throw error("PR_GUARD_EXTERNAL_HEAD");
	if (selected && branch && selected.branch !== branch)
		throw error("PR_GUARD_BRANCH_MISMATCH");
	if (
		selected &&
		localBase &&
		selected.baseSha &&
		selected.baseSha !== localBase
	)
		throw error("PR_GUARD_BASE_STALE");
	if (
		selected &&
		expectedHead &&
		selected.head.toLowerCase() !== expectedHead.toLowerCase()
	)
		throw error("PR_GUARD_HEAD_CHANGED");
	if (selected && trackingHead && selected.head !== trackingHead)
		throw error("PR_GUARD_HEAD_CHANGED");
	if (selected && !expectedHead && !trackingHead)
		throw error("PR_GUARD_HEAD_NOT_PINNED");
	const names = new Set(requested);
	const overlaps = prs
		.map((pr) => ({
			number: pr.number,
			repo: pr.repo ?? REPO,
			paths: pr.paths.filter((path) => names.has(path)).sort(),
		}))
		.filter((pr) => pr.paths.length);
	const others = overlaps.filter((pr) => pr.number !== selected?.number);
	if (others.length > 1 || (others.length && selected))
		return { kind: "CONFLICT", selected: selected?.number ?? null, overlaps };
	if (others.length === 1)
		return {
			kind: others[0].repo === REPO ? "REUSE" : "CONFLICT",
			selected: null,
			overlaps,
		};
	return {
		kind: selected ? "CONTINUE" : "NO_MATCH",
		selected: selected?.number ?? null,
		overlaps,
	};
}

async function main(argv) {
	const args = parseArgs(argv);
	if (args.help) {
		console.log(
			"Usage: node scripts/agent-pr-guard.mjs [--paths FILE ...] [--pr N] [--expected-head SHA]",
		);
		console.log(
			"Read-only; requires authenticated gh. No CI, writes, or retries.",
		);
		return 0;
	}
	const branch = git(["symbolic-ref", "--quiet", "--short", "HEAD"]);
	const localBase = git(["rev-parse", "--verify", "origin/master^{commit}"]);
	const origin = git(["remote", "get-url", "origin"]);
	if (
		origin &&
		!/^(?:https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)AlbanAndrieu\/nabla-site-alban(?:\.git)?$/.test(
			origin,
		)
	)
		throw error("PR_GUARD_WRONG_REPOSITORY");
	if (branch === "master" && !args.paths.length)
		throw error("PR_GUARD_PROTECTED_BRANCH");
	const scope = args.paths.length ? normalizePaths(args.paths) : gitScope();
	if (!scope.length) throw error("PR_GUARD_SCOPE_EMPTY");
	const prs = await openPullRequests();
	const selected = prs.find(
		(pr) =>
			pr.number === args.current ||
			(args.current === null &&
				branch &&
				pr.branch === branch &&
				pr.repo === REPO),
	);
	const trackingHead =
		selected && branch === selected.branch
			? git([
					"rev-parse",
					"--verify",
					"refs/remotes/origin/" + selected.branch + "^{commit}",
				])
			: null;
	const decision = decideReuse(scope, prs, {
		current: args.current,
		branch,
		localBase,
		trackingHead,
		expectedHead: args.expectedHead,
	});
	const overlaps = decision.overlaps
		.map(
			(pr) =>
				"#" +
				pr.number +
				":" +
				pr.paths.slice(0, 4).join(",") +
				(pr.paths.length > 4 ? "(+" + (pr.paths.length - 4) + ")" : ""),
		)
		.join(" ");
	console.log(
		"PR_GUARD_" +
			decision.kind +
			" branch=" +
			(branch ?? "SOURCE_ONLY") +
			" scope=" +
			scope.length +
			" open=" +
			prs.length +
			" current=" +
			(decision.selected ?? "none") +
			(overlaps ? " overlap=" + overlaps : ""),
	);
	if (decision.kind === "REUSE" || decision.kind === "CONFLICT") return 4;
	if (branch === "master")
		console.log(
			"PR_GUARD_PLAN_ONLY: never edit master; switch to an open PR branch.",
		);
	if (decision.kind === "NO_MATCH")
		console.log(
			"PR_GUARD_REVIEW_THEME: inspect existing PR themes before creating one.",
		);
	return 0;
}

if (
	process.argv[1] &&
	resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
	main(process.argv.slice(2))
		.then((code) => {
			process.exitCode = code;
		})
		.catch((cause) => {
			console.error(cause?.code ?? "PR_GUARD_UNEXPECTED_ERROR");
			process.exitCode = 3;
		});
}
