import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { relative } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = new URL("../", import.meta.url);
const localizedAppRoot = new URL("../app/[locale]/", import.meta.url);

async function findLocalizedPages(directory: URL): Promise<URL[]> {
	const entries = await readdir(directory, { withFileTypes: true });
	const pages: URL[] = [];

	for (const entry of entries) {
		const child = new URL(
			entry.isDirectory() ? `${entry.name}/` : entry.name,
			directory,
		);
		if (entry.isDirectory()) {
			pages.push(...(await findLocalizedPages(child)));
		} else if (entry.name === "page.tsx") {
			pages.push(child);
		}
	}

	return pages;
}

const delegatedMainTargets = new Map<string, string>([
	["app/[locale]/login/page.tsx", "app/[locale]/login/LoginClient.tsx"],
]);

test("every localized App Router page exposes exactly one main-content target", async () => {
	const pages = await findLocalizedPages(localizedAppRoot);
	assert.ok(pages.length > 0, "localized page discovery must not be empty");

	for (const page of pages) {
		const relativePage = relative(
			fileURLToPath(repoRoot),
			fileURLToPath(page),
		).replaceAll("\\", "/");
		const delegatedOwner = delegatedMainTargets.get(relativePage);
		const target = delegatedOwner
			? new URL(`../${delegatedOwner}`, import.meta.url)
			: page;
		const source = await readFile(target, "utf8");
		const targets = source.match(/id="main-content"/g) ?? [];
		const ownerLabel = delegatedOwner ? ` via ${delegatedOwner}` : "";

		assert.equal(
			targets.length,
			1,
			`${relativePage} must expose exactly one main-content target${ownerLabel}`,
		);
	}
});
