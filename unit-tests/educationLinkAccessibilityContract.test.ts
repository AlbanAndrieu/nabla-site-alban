import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("education detail links remain distinguishable without relying on color", async () => {
	const css = await readFile(
		new URL("../public/education.css", import.meta.url),
		"utf8",
	);

	assert.ok(css.includes(".education-details a {"));
	assert.ok(css.includes("text-decoration: underline;"));
	assert.ok(css.includes("text-underline-offset:"));

});
