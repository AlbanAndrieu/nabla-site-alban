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

test("app routes consume page metadata through the compatibility facade", () => {
	const offenders = sourceFiles(APP_DIR)
		.filter((path) => {
			const source = readFileSync(path, "utf8");
			return /import\s*\{[^}]*\bbuildPageMetadata\b[^}]*\}\s*from\s*["']@\/lib\/socialMetadata["']/.test(
				source,
			);
		})
		.map((path) => relative(ROOT, path));

	assert.deepEqual(
		offenders,
		[],
		"App routes must import buildPageMetadata from @/lib/siteMetadata so parallel SEO changes cannot introduce duplicate bindings.",
	);
});

test("siteMetadata remains a thin facade over socialMetadata", () => {
	const source = readFileSync(join(ROOT, "lib/siteMetadata.ts"), "utf8");
	assert.match(source, /\bbuildPageMetadata\b/);
	assert.match(source, /from\s+["']@\/lib\/socialMetadata["']/);
});
