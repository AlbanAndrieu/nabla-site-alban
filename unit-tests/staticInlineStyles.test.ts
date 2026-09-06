import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const STATIC_LAYOUT_FILES = [
	"app/[locale]/architecture/page.tsx",
	"app/components/truenas/ToolsSection.tsx",
	"app/components/truenas/NablaProjectSection.tsx",
	"app/[locale]/contact/page.tsx",
	"app/[locale]/cv/page.tsx",
] as const;

test("priority static layouts avoid inline style objects", async () => {
	const sources = await Promise.all(
		STATIC_LAYOUT_FILES.map((path) => readFile(path, "utf8")),
	);
	for (const [index, source] of sources.entries()) {
		assert.doesNotMatch(
			source,
			/style=\{\{/,
			`${STATIC_LAYOUT_FILES[index]} should use reusable CSS for static layout`,
		);
	}
});
