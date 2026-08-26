import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const APP_DIR = join(ROOT, "app");

function sourceFiles(dir: string): string[] {
	return readdirSync(dir).flatMap((entry) => {
		const path = join(dir, entry);
		if (statSync(path).isDirectory()) return sourceFiles(path);
		return /\.(?:ts|tsx)$/.test(entry) ? [path] : [];
	});
}

function duplicateNamedImports(source: string): string[] {
	const imports = source.matchAll(
		/import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+["'][^"']+["']/g,
	);
	const seen = new Set<string>();
	const duplicates = new Set<string>();

	for (const match of imports) {
		for (const rawSpecifier of match[1].split(",")) {
			const specifier = rawSpecifier.trim().replace(/^type\s+/, "");
			if (!specifier) continue;
			const alias = specifier.split(/\s+as\s+/);
			const localName = (alias[1] ?? alias[0]).trim();
			if (seen.has(localName)) duplicates.add(localName);
			seen.add(localName);
		}
	}
	return [...duplicates].sort();
}

test("App Router sources do not bind the same named import more than once", () => {
	const offenders = sourceFiles(APP_DIR).flatMap((path) =>
		duplicateNamedImports(readFileSync(path, "utf8")).map(
			(name) => `${relative(ROOT, path)}: ${name}`,
		),
	);

	assert.deepEqual(
		offenders,
		[],
		"A duplicate local import binding can pass independent PR checks but break the merged Turbopack build.",
	);
});

test("siteMetadata remains a thin facade over socialMetadata", () => {
	const source = readFileSync(join(ROOT, "lib/siteMetadata.ts"), "utf8");
	assert.match(source, /\bbuildPageMetadata\b/);
	assert.match(source, /from\s+["']@\/lib\/socialMetadata["']/);
});
