import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DOCS = path.join(ROOT, "docs");
const ROADMAPS = new Set([
	"docs/quality-roadmap.md",
	"docs/homelab-roadmap.md",
]);

async function markdownFiles(directory: string): Promise<string[]> {
	const entries = await readdir(directory, { withFileTypes: true });
	const nested = await Promise.all(
		entries.map(async (entry) => {
			const absolute = path.join(directory, entry.name);
			if (entry.isDirectory()) return markdownFiles(absolute);
			return entry.isFile() && entry.name.endsWith(".md") ? [absolute] : [];
		}),
	);
	return nested.flat().sort();
}

function openChecklistLines(markdown: string): string[] {
	let fenced = false;
	return markdown.split("\n").filter((line) => {
		if (/^\s*```/.test(line)) {
			fenced = !fenced;
			return false;
		}
		return !fenced && /^\s*[-*+]\s+\[\s\]\s+/.test(line);
	});
}

test("open documentation checklists live only in canonical roadmaps", async () => {
	for (const absolute of await markdownFiles(DOCS)) {
		const relative = path.relative(ROOT, absolute).split(path.sep).join("/");
		const markdown = await readFile(absolute, "utf8");
		const openItems = openChecklistLines(markdown);
		if (ROADMAPS.has(relative)) {
			assert.ok(openItems.length > 0, `${relative} should contain active work`);
		} else {
			assert.deepEqual(openItems, [], `${relative} must not own open backlog`);
		}
	}
});

test("durable homelab contracts do not regain migration delivery plans", async () => {
	const [dependencyHealth, catalog] = await Promise.all([
		readFile(path.join(DOCS, "homelab-dependency-health-ui.md"), "utf8"),
		readFile(path.join(DOCS, "homelab-services-catalog.md"), "utf8"),
	]);

	assert.doesNotMatch(dependencyHealth, /^## Delivery order$/m);
	assert.doesNotMatch(catalog, /^## Cutover sequence$/m);
	assert.match(dependencyHealth, /docs\/homelab-roadmap\.md/);
	assert.match(catalog, /docs\/homelab-roadmap\.md/);
});

test("documentation index keeps roadmap, runbook, incident and contract ownership explicit", async () => {
	const index = await readFile(path.join(DOCS, "README.md"), "utf8");

	assert.match(index, /Roadmaps actives/);
	assert.match(index, /Un runbook décrit l'état courant et le diagnostic/);
	assert.match(index, /document de contrat décrit les invariants/);
	assert.match(index, /incidents vont sous `docs\/incidents\/`/);
});

test("documentation index relative links resolve", async () => {
	const indexPath = path.join(DOCS, "README.md");
	const index = await readFile(indexPath, "utf8");
	const targets = [
		...index.matchAll(/\[[^\]]+\]\((?![a-z]+:|#)([^)]+)\)/gi),
	].map((match) => match[1]);

	assert.ok(
		targets.length > 0,
		"documentation index should contain local links",
	);
	for (const target of targets) {
		const relativeTarget = target.split("#", 1)[0];
		if (!relativeTarget) continue;
		const absolute = path.resolve(
			path.dirname(indexPath),
			decodeURIComponent(relativeTarget),
		);
		try {
			await access(absolute);
		} catch {
			assert.fail(`broken documentation index link: ${target}`);
		}
	}
});
