import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) =>
	readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Next layout opts into native preferred text scaling", async () => {
	const [layout, e2e] = await Promise.all([
		read("app/[locale]/layout.tsx"),
		read("tests/accessibility-responsive.spec.ts"),
	]);

	assert.match(layout, /<meta name="text-scale" content="scale" \/>/);
	assert.match(e2e, /newCDPSession\(page\)/);
	assert.match(e2e, /Emulation\.setEmulatedOSTextScale/);
	assert.match(e2e, /scale: 2/);
	assert.doesNotMatch(e2e, /page\.addStyleTag/);
	assert.doesNotMatch(
		e2e,
		/documentElement\.style\.setProperty\(\s*"font-size"/,
	);
});
