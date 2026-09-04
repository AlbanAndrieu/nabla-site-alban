import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageSource = await readFile("app/[locale]/security/page.tsx", "utf8");
const sectionSource = await readFile(
	"app/[locale]/security/SecurityCoreSections.tsx",
	"utf8",
);
const resourceSource = await readFile(
	"app/[locale]/security/securityResources.ts",
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

test("security no longer renders legacy public HTML", () => {
	assert.doesNotMatch(pageSource, /PublicHtmlFragment/);
	assert.doesNotMatch(pageSource, /security\.html/);
	assert.doesNotMatch(pageSource, /NATIVE_SECTION_IDS/);
	assert.match(pageSource, /<SecurityCoreSections locale=\{locale\} \/>/);
	assert.match(pageSource, /<SecurityVisualizations locale=\{locale\} \/>/);
});

test("all security resource anchors are owned by React", () => {
	for (const id of [
		"owasp-resources",
		"personal-security-checklist",
		"network-security-scanning",
		"system-hardening-cis",
		"ssh-security-hardening",
		"openclaw-security",
		"security-standards-compliance",
		"vulnerability-management",
		"vulnerability-scanning-dast-sast",
		"pentest-tools",
		"siem-malware-detection",
		"devsecops-tools",
		"authentication-jwt",
		"app-infrastructure-security",
		"cloud-security-resources",
		"security-learning-resources",
	]) {
		assert.match(resourceSource, new RegExp(`id: "${id}"`));
	}

	assert.match(sectionSource, /RESOURCE_SECTIONS\.map/);
	assert.match(sectionSource, /id="hero"/);
	assert.match(sectionSource, /security-standards-compliance/);
});
