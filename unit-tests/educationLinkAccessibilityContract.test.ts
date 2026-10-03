import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path: string) =>
	readFile(new URL("../" + path, import.meta.url), "utf8");

test("inline content links remain distinguishable without relying on color", async () => {
	const [globals, education, component] = await Promise.all([
		source("app/globals.css"),
		source("public/education.css"),
		source("app/components/home/HomeEducationSection.tsx"),
	]);

	assert.ok(globals.includes(".content-inline-link {"));
	assert.ok(globals.includes("text-decoration: underline;"));
	assert.ok(globals.includes("text-underline-offset:"));
	assert.ok(component.includes('className="content-inline-link"'));
	assert.doesNotMatch(education, /\.education-details a/);
});
