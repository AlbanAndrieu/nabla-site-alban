import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const securityPagePath = new URL(
	"../app/[locale]/security/page.tsx",
	import.meta.url,
);
const securitySectionsPath = new URL(
	"../app/[locale]/security/SecurityCoreSections.tsx",
	import.meta.url,
);
const resourcesPath = new URL(
	"../app/[locale]/security/securityResources.ts",
	import.meta.url,
);
const messagesLoaderPath = new URL("../i18n/messages.ts", import.meta.url);

const EXPECTED_LINK_COUNTS = {
	owasp: 8,
	personal: 3,
	network: 5,
	hardening: 9,
	ssh: 7,
	openclaw: 3,
	compliance: 7,
	vulnerability: 8,
	ciScanning: 2,
	pentest: 1,
	siem: 1,
	devsecops: 16,
	authentication: 1,
	infrastructure: 1,
	cloud: 4,
	learning: 4,
} as const;

test("security uses its dedicated next-intl catalog", async () => {
	const [page, sections, resources, loader] = await Promise.all([
		readFile(securityPagePath, "utf8"),
		readFile(securitySectionsPath, "utf8"),
		readFile(resourcesPath, "utf8"),
		readFile(messagesLoaderPath, "utf8"),
	]);

	assert.doesNotMatch(page, /metadataFromPublicHtml/);
	assert.doesNotMatch(page, /PublicHtmlFragment/);
	assert.match(page, /namespace: "securityPage\.meta"/);
	assert.doesNotMatch(sections, /const COPY/);
	assert.match(sections, /getTranslations/);
	assert.match(sections, /ExternalLink/);
	assert.match(sections, /Container/);
	assert.match(sections, /canonicalPagePath/);
	assert.match(sections, /nativeSections\.\$\{definition\.key\}/);
	assert.doesNotMatch(resources, /\/ai\.html#/);
	assert.match(loader, /SECURITY_LOADERS/);
	assert.match(loader, /"securityPage"/);
});

test("security catalogs keep matching the complete native resource contract", async () => {
	for (const locale of ["en", "fr"] as const) {
		const raw = await readFile(
			new URL(`../messages/security/${locale}.json`, import.meta.url),
			"utf8",
		);
		const catalog = JSON.parse(raw) as {
			securityPage: {
				meta: { title: string; description: string };
				hero: Record<string, string>;
				nativeSections: Record<
					string,
					{ badge: string; title: string; description: string; links: string[] }
				>;
			};
		};

		assert.ok(catalog.securityPage.meta.title);
		assert.ok(catalog.securityPage.meta.description);
		assert.deepEqual(
			Object.keys(catalog.securityPage.nativeSections).sort(),
			Object.keys(EXPECTED_LINK_COUNTS).sort(),
		);
		for (const [key, expectedLinks] of Object.entries(EXPECTED_LINK_COUNTS)) {
			const section = catalog.securityPage.nativeSections[key];
			assert.ok(section, `${locale}:${key} section must exist`);
			assert.ok(section.badge);
			assert.ok(section.title);
			assert.ok(section.description);
			assert.equal(section.links.length, expectedLinks);
			assert.ok(section.links.every(Boolean));
		}
	}
});
