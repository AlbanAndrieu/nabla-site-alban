import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const CV_SIZES = ["small", "medium", "large", "full"] as const;
const CV_LOCALES = ["de", "en", "fr", "no"] as const;

test("historical CV variants remain standalone static HTML documents", async () => {
	for (const size of CV_SIZES) {
		for (const locale of CV_LOCALES) {
			const filename = `cv-${size}-${locale}.html`;
			const source = await readFile(
				path.join(process.cwd(), "public", "cv", filename),
				"utf8",
			);

			assert.match(source, /<!doctype html>/i, `${filename} must keep a doctype`);
			assert.match(source, /<html\b/i, `${filename} must remain a full HTML page`);
			assert.match(source, /<body\b/i, `${filename} must keep its own body`);
		}
	}
});
