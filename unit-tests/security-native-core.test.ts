import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageSource = await readFile("app/[locale]/security/page.tsx", "utf8");
const sectionSource = await readFile(
	"app/[locale]/security/SecurityCoreSections.tsx",
	"utf8",
);

test("security owns its semantic main and shared skip link", () => {
	assert.match(pageSource, /<SkipToMainContent\s*\/>/);
	assert.match(
		pageSource,
		/<main id="main-content" className="security-resources">/,
	);
	assert.doesNotMatch(pageSource, /className="skip-to-main"/);
});

test("security renders legacy content as a main-body fragment only", () => {
	assert.match(pageSource, /mode="main"/);
	assert.doesNotMatch(pageSource, /mode="headerMain"/);
	assert.match(pageSource, /omitElementIds=\{NATIVE_SECTION_IDS\}/);
});

test("core security anchors are owned by React", () => {
	for (const id of [
		"owasp-resources",
		"personal-security-checklist",
		"network-security-scanning",
	]) {
		assert.match(pageSource, new RegExp(`"${id}"`));
		assert.match(sectionSource, new RegExp(`id: "${id}"`));
	}

	assert.match(sectionSource, /id="hero"/);
	assert.match(sectionSource, /security-standards-compliance/);
});
