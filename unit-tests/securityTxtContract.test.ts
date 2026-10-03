import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const securityTxtPath = new URL("../public/security.txt", import.meta.url);

test("security.txt uses canonical www and native privacy policy routes", async () => {
	const content = await readFile(securityTxtPath, "utf8");

	assert.match(
		content,
		/^Canonical: https:\/\/www\.albanandrieu\.com\/security\.txt$/m,
	);
	assert.match(
		content,
		/^Policy: https:\/\/www\.albanandrieu\.com\/policy\/privacy_policy$/m,
	);
	assert.match(
		content,
		/^Policy: https:\/\/www\.albanandrieu\.com\/fr\/policy\/privacy_policy$/m,
	);
	assert.doesNotMatch(content, /privacy\.html/);
	assert.doesNotMatch(content, /^Policy: https:\/\/albanandrieu\.com\//m);
});
