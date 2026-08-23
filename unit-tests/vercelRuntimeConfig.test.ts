import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ROOT = new URL("../", import.meta.url);

test("Vercel ignores only the legacy root api directory", async () => {
	const ignore = await readFile(new URL(".vercelignore", ROOT), "utf8");
	const rules = ignore
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line && !line.startsWith("#"));

	assert.ok(rules.includes("/api/"));
	assert.ok(!rules.includes("api"));
	assert.ok(!rules.some((rule) => rule.startsWith("!app/api")));
});

test("TrueNAS page is explicitly rendered at runtime", async () => {
	const source = await readFile(
		new URL("app/[locale]/truenas/page.tsx", ROOT),
		"utf8",
	);

	assert.match(source, /export const dynamic = ["']force-dynamic["'];/);
});
