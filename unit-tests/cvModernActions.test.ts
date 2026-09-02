import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const cvPagePath = new URL("../app/[locale]/cv/page.tsx", import.meta.url);
const actionLinkPath = new URL("../components/ui/ActionLink.tsx", import.meta.url);
const actionStylesPath = new URL("../components/ui/Action.module.css", import.meta.url);

test("modern CV format links use the shared compact action primitive", async () => {
	const [page, action, styles] = await Promise.all([
		readFile(cvPagePath, "utf8"),
		readFile(actionLinkPath, "utf8"),
		readFile(actionStylesPath, "utf8"),
	]);

	assert.match(page, /<ActionLink/);
	assert.match(page, /size="compact"/);
	assert.match(page, /variant="outline"/);
	assert.doesNotMatch(page, /btn btn-sm btn-outline-primary/);
	assert.match(action, /type ActionSize = "default" \| "compact"/);
	assert.match(styles, /\.compact\s*\{/);
	assert.match(styles, /min-height: var\(--ui-control-min-height\)/);
});

test("modern CV index keeps historical standalone HTML targets", async () => {
	const page = await readFile(cvPagePath, "utf8");

	assert.match(page, /\["small", "medium", "large", "full"\]/);
	assert.match(page, /`\/cv\/cv-\$\{size\}-\$\{language\}\.html`/);
});
