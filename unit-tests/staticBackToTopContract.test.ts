import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path: string) =>
	readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("static back-to-top links keep a defined shared scroll handler", async () => {
	const [widgets, rootPage, localizedPage, nestedPage] = await Promise.all([
		source("public/site-widgets.js"),
		source("public/index.html"),
		source("public/locales/fr/checkout.html"),
		source("public/jm/4-years-review-aandrieu.html"),
	]);

	assert.match(widgets, /function scrollToTopOfPage\(\)/);
	assert.match(widgets, /window\.scrollTo\(0, 0\)/);
	assert.match(widgets, /document\.body\.scrollTop = 0/);
	assert.match(widgets, /document\.documentElement\.scrollTop = 0/);
	assert.match(
		widgets,
		/\/\^top\$\/i\.test\(frag\)[\s\S]*scrollToTopOfPage\(\)/,
	);

	for (const page of [rootPage, localizedPage, nestedPage]) {
		assert.match(page, /href=["']#top["']/);
		assert.match(page, /site-widgets\.js/);
	}
});
