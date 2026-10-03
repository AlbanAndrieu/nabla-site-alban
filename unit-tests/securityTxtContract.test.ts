import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const legacyPath = new URL("../public/security.txt", import.meta.url);
const wellKnownPath = new URL(
	"../public/.well-known/security.txt",
	import.meta.url,
);

test("security.txt follows the RFC 9116 location and canonical policy routes", async () => {
	const [legacy, wellKnown] = await Promise.all([
		readFile(legacyPath, "utf8"),
		readFile(wellKnownPath, "utf8"),
	]);

	assert.equal(legacy, wellKnown);
	assert.match(
		wellKnown,
		/^Canonical: https:\/\/www\.albanandrieu\.com\/\.well-known\/security\.txt$/m,
	);
	assert.match(
		wellKnown,
		/^Expires: 2027-10-03T00:00:00Z$/m,
	);
	assert.match(
		wellKnown,
		/^Policy: https:\/\/www\.albanandrieu\.com\/policy\/privacy_policy$/m,
	);
	assert.match(
		wellKnown,
		/^Policy: https:\/\/www\.albanandrieu\.com\/fr\/policy\/privacy_policy$/m,
	);
	assert.doesNotMatch(wellKnown, /privacy\.html/);
	assert.doesNotMatch(wellKnown, /^Policy: https:\/\/albanandrieu\.com\//m);
	assert.equal((wellKnown.match(/^Expires:/gm) ?? []).length, 1);
});
