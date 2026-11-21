import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

// The Netgate 1100 was retired on 18/11/2026 with no replacement: the page must not read as live.
test("pfSense page states the 18/11/2026 retirement in both locales", async () => {
	for (const [locale, date] of [
		["fr", "18 novembre 2026"],
		["en", "18 November 2026"],
	]) {
		const { pfsensePage } = JSON.parse(await read(`messages/${locale}.json`));
		assert.match(pfsensePage.retired, new RegExp(date), locale);
		assert.match(pfsensePage.retired, /Freebox/, locale);
		assert.match(pfsensePage.retired, /R7000/, locale);
	}
	const page = await read("app/[locale]/pfsense/page.tsx");
	assert.match(page, /role="note">\s*\{t\("retired"\)\}/);
});
