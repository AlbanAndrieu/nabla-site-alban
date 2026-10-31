// Private NDA keyword lists: never versioned, never printed; findings name only
// `<source>:private-<line>`.
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const PRIVATE_LIST = ".nda-keywords.local";

function invalid(detail) {
	return new Error(`NDA_GUARD_CONFIG_INVALID: ${detail}`);
}

// One regex per line, merged so no source can mask another: NDA_KEYWORDS (CI
// secret), then the checkout's and the user's git-ignored .nda-keywords.local.
// An empty result means the private check did not run.
export function readPrivateLists(env = process.env, home = homedir()) {
	const lists = [];
	if (env.NDA_KEYWORDS?.trim()) {
		lists.push({ source: "env", text: env.NDA_KEYWORDS });
	}
	for (const [source, dir] of [
		["repo", ROOT],
		["home", home],
	]) {
		try {
			lists.push({
				source,
				text: readFileSync(join(dir, PRIVATE_LIST), "utf8"),
			});
		} catch (error) {
			// Only a missing file is optional; an unreadable one must not pass silently.
			if (error.code !== "ENOENT")
				throw invalid(`${source} private list unreadable`);
		}
	}
	return lists;
}

export function privatePatterns(lists) {
	const patterns = [];
	for (const { source, text } of lists) {
		text.split("\n").forEach((line, index) => {
			const value = line.trim();
			if (!value || value.startsWith("#")) return;
			const id = `${source}:private-${index + 1}`;
			try {
				patterns.push({ id, regex: new RegExp(value, "iu"), private: true });
			} catch {
				throw invalid(id); // never echo a private pattern
			}
		});
	}
	return patterns;
}
