// Fail closed when published content mentions NDA-sensitive employer terms.
// Output names only file, line and pattern id: never the matched text.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const CONFIG = new URL("./nda-guard.json", import.meta.url);
const PRIVATE_LIST = join(ROOT, ".nda-keywords.local");
// Salted so the public hashes are not lookups in generic rainbow tables.
const SALT = "nabla-nda-guard:v1:";
const MAX_REPORTED = 20;
// shortcut: longer tokens are encoded blobs, not prose; substring hashing skips them.
const MAX_SUBSTRING_TOKEN = 64;
const SCOPES = new Set(["public-mention", "personal", "employer-data"]);
const hashCache = new Map();

export function tokens(text) {
	return text
		.normalize("NFKD")
		.replace(/\p{M}/gu, "")
		.toLowerCase()
		.split(/[^\p{L}\p{N}]+/u)
		.filter(Boolean);
}

function digest(key) {
	let value = hashCache.get(key);
	if (!value) {
		value = createHash("sha256")
			.update(SALT + key)
			.digest("hex");
		hashCache.set(key, value);
	}
	return value;
}

export function hashTerm(term) {
	return digest(tokens(term).join(" "));
}

function invalid(detail) {
	return new Error(`NDA_GUARD_CONFIG_INVALID: ${detail}`);
}

// Private regexes, one per line: NDA_KEYWORDS (CI secret) or the git-ignored
// .nda-keywords.local. null means the private check did not run.
export function readPrivateList() {
	if (process.env.NDA_KEYWORDS?.trim()) return process.env.NDA_KEYWORDS;
	try {
		return readFileSync(PRIVATE_LIST, "utf8");
	} catch {
		return null;
	}
}

function privatePatterns(source) {
	const patterns = [];
	source.split("\n").forEach((line, index) => {
		const value = line.trim();
		if (!value || value.startsWith("#")) return;
		const id = `private-${index + 1}`;
		try {
			patterns.push({ id, regex: new RegExp(value, "iu") });
		} catch {
			throw invalid(id); // never echo a private pattern
		}
	});
	return patterns;
}

export function loadConfig(
	source = readFileSync(CONFIG, "utf8"),
	privateList = readPrivateList(),
) {
	const raw = JSON.parse(source);
	if (!Array.isArray(raw.roots) || raw.roots.length === 0) {
		throw invalid("roots");
	}
	const patterns = new Map();
	for (const entry of raw.patterns ?? []) {
		if (!entry.id || patterns.has(entry.id)) throw invalid(`id ${entry.id}`);
		if (entry.regex) {
			patterns.set(entry.id, {
				id: entry.id,
				regex: new RegExp(entry.regex, "iu"),
			});
		} else if (
			/^[0-9a-f]{64}$/.test(entry.sha256 ?? "") &&
			(entry.chars === undefined || Number.isInteger(entry.chars))
		) {
			patterns.set(entry.id, {
				id: entry.id,
				sha256: entry.sha256,
				words: entry.words ?? 1,
				chars: entry.chars,
			});
		} else {
			throw invalid(`${entry.id} needs regex or sha256`);
		}
	}
	const allow = (raw.allow ?? []).map((entry, index) => {
		const ids = entry.patterns ?? [];
		if (!entry.reason?.trim() || !entry.paths?.length || ids.length === 0) {
			throw invalid(`allow[${index}] needs patterns, paths and reason`);
		}
		for (const id of ids) {
			if (!patterns.has(id)) throw invalid(`allow[${index}] unknown ${id}`);
		}
		if (!SCOPES.has(entry.scope)) throw invalid(`allow[${index}] scope`);
		// Security gate: employer data is published only with that employer's recorded approval.
		const approval = entry.approval ?? {};
		if (
			entry.scope === "employer-data" &&
			!(
				approval.role?.trim() &&
				approval.employer?.trim() &&
				/^https:\/\/\S+$/.test(approval.reference ?? "")
			)
		) {
			throw invalid(`allow[${index}] employer-data needs approval`);
		}
		return {
			patterns: new Set(ids),
			paths: entry.paths,
			line: entry.line ? new RegExp(entry.line, "iu") : null,
		};
	});
	const extra = privateList === null ? null : privatePatterns(privateList);
	return {
		roots: raw.roots,
		patterns: [...patterns.values(), ...(extra ?? [])],
		allow,
		privateCount: extra?.length ?? null,
	};
}

function containsHashed(word, pattern) {
	if (word.length > MAX_SUBSTRING_TOKEN) return false;
	for (let i = 0; i + pattern.chars <= word.length; i++) {
		if (digest(word.slice(i, i + pattern.chars)) === pattern.sha256) {
			return true;
		}
	}
	return false;
}

function matches(pattern, text, words) {
	if (pattern.regex) return pattern.regex.test(text);
	// `chars` keeps regex-like substring matching (no word boundary) for one word.
	if (pattern.chars) return words.some((w) => containsHashed(w, pattern));
	const size = pattern.words;
	for (let i = 0; i + size <= words.length; i++) {
		if (digest(words.slice(i, i + size).join(" ")) === pattern.sha256) {
			return true;
		}
	}
	return false;
}

function allowed(config, file, text, id) {
	return config.allow.some(
		(entry) =>
			entry.patterns.has(id) &&
			entry.paths.some((path) =>
				path.endsWith("/") ? file.startsWith(path) : file === path,
			) &&
			(!entry.line || entry.line.test(text)),
	);
}

export function scanText(file, content, config) {
	const findings = [];
	content.split("\n").forEach((text, index) => {
		const words = tokens(text);
		for (const pattern of config.patterns) {
			if (
				matches(pattern, text, words) &&
				!allowed(config, file, text, pattern.id)
			) {
				findings.push({ file, line: index + 1, pattern: pattern.id });
			}
		}
	});
	return findings;
}

export function publishedFiles(config, root = ROOT) {
	return execFileSync("git", ["ls-files", "-z", "--", ...config.roots], {
		cwd: root,
		encoding: "utf8",
	})
		.split("\0")
		.filter(Boolean);
}

export function scanRepository(config = loadConfig(), root = ROOT) {
	const findings = [];
	for (const file of publishedFiles(config, root)) {
		let buffer;
		try {
			buffer = readFileSync(join(root, file));
		} catch {
			continue; // deleted in the working tree: nothing left to publish
		}
		// shortcut: binary files (PDF, DOCX, images) are skipped; extract their text before scanning them.
		if (buffer.subarray(0, 8000).includes(0)) continue;
		findings.push(...scanText(file, buffer.toString("utf8"), config));
	}
	return findings;
}

export function formatFindings(findings) {
	const lines = findings
		.slice(0, MAX_REPORTED)
		.map((f) => `NDA_GUARD_FINDING ${f.file}:${f.line} ${f.pattern}`);
	if (findings.length > MAX_REPORTED) {
		lines.push(`NDA_GUARD_FINDINGS_OMITTED ${findings.length - MAX_REPORTED}`);
	}
	return lines.join("\n");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const [flag, term] = process.argv.slice(2);
	if (flag === "--hash") {
		if (!term) {
			console.error('NDA_GUARD_USAGE: --hash "<term>"');
			process.exit(2);
		}
		const words = tokens(term);
		const chars = words.length === 1 ? words[0].length : undefined;
		console.log(
			JSON.stringify({ sha256: hashTerm(term), words: words.length, chars }),
		);
		process.exit(0);
	}
	const config = loadConfig();
	if (config.privateCount === null) {
		console.error(
			"NDA_PRIVATE_LIST_NOT_RUN: no NDA_KEYWORDS or .nda-keywords.local; public list only",
		);
	}
	const findings = scanRepository(config);
	if (findings.length > 0) {
		console.error(formatFindings(findings));
		console.error(
			`NDA_GUARD_FAILED ${findings.length} finding(s); see .agents/skills/nabla-nda-guard/SKILL.md`,
		);
		process.exit(1);
	}
	console.log(`NDA_GUARD_OK private=${config.privateCount ?? "NOT_RUN"}`);
}
