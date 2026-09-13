import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path: string) =>
	readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Next runtime globally honors reduced motion like Bababou", async () => {
	const [reset, accessibility] = await Promise.all([
		source("app/reset.css"),
		source("app/accessibility.css"),
	]);

	assert.match(reset, /^@import "\.\/accessibility\.css";$/m);
	assert.match(accessibility, /@media \(prefers-reduced-motion:\s*reduce\)/);
	assert.match(accessibility, /animation-duration:\s*0\.01ms\s*!important/);
	assert.match(accessibility, /animation-iteration-count:\s*1\s*!important/);
	assert.match(accessibility, /transition-duration:\s*0\.01ms\s*!important/);
	assert.match(accessibility, /scroll-behavior:\s*auto\s*!important/);
});
