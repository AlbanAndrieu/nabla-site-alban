import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("education detail links remain distinguishable without relying on color", async () => {
	const css = await readFile(
		new URL("../public/education.css", import.meta.url),
		"utf8",
	);

	assert.match(\n\t\tcss,\n\t\t/\\.education-details a\\s*\\{[\\s\\S]*text-decoration:\\s*underline;/,\n\t);
	assert.match(css, /text-underline-offset:/);
});
