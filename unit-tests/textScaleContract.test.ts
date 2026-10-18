import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) =>
	readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("preferred text scaling opts in through the text-scale meta and Chromium emulation", async () => {
	const [reset, layout, e2e] = await Promise.all([
		read("app/reset.css"),
		read("app/[locale]/layout.tsx"),
		read("tests/accessibility-responsive.spec.ts"),
	]);

	// Chromium 156 exposes the OS text scale only to pages opting in with the
	// meta, which then scales the initial font size itself: multiplying by
	// env(preferred-text-scale) as well would double it (64px at 200%).
	assert.match(layout, /<meta name="text-scale" content="scale" \/>/);
	assert.match(reset, /html \{\n\tfont-size: 100%;\n\}/);
	assert.doesNotMatch(reset, /font-size:[^;]*env\(preferred-text-scale/);
	assert.match(e2e, /newCDPSession\(page\)/);
	assert.match(e2e, /Emulation\.setEmulatedOSTextScale/);
	assert.match(e2e, /scale: 2/);
	assert.match(e2e, /browserName !== "chromium"/);
	assert.doesNotMatch(e2e, /page\.addStyleTag/);
	assert.doesNotMatch(
		e2e,
		/documentElement\.style\.setProperty\(\s*"font-size"/,
	);
});
