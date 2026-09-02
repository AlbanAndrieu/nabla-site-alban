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
const messagesLoaderPath = new URL("../i18n/messages.ts", import.meta.url);

test("security uses its dedicated next-intl catalog", async () => {
	const [page, sections, loader] = await Promise.all([
		readFile(securityPagePath, "utf8"),
		readFile(securitySectionsPath, "utf8"),
		readFile(messagesLoaderPath, "utf8"),
	]);

	assert.doesNotMatch(page, /metadataFromPublicHtml/);
	assert.match(page, /namespace: "securityPage\.meta"/);
	assert.doesNotMatch(sections, /const COPY/);
	assert.match(sections, /getTranslations/);
	assert.match(sections, /ExternalLink/);
	assert.match(sections, /Container/);
	assert.match(loader, /SECURITY_LOADERS/);
	assert.match(loader, /"securityPage"/);
});

test("security catalogs keep matching native section contracts", async () => {
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
		for (const [key, expectedLinks] of [
			["owasp", 8],
			["personal", 3],
			["network", 5],
			["hardening", 9],
		] as const) {
			const section = catalog.securityPage.nativeSections[key];
			assert.ok(section, `${locale}:${key} section must exist`);
			assert.ok(section.badge);
			assert.ok(section.title);
			assert.ok(section.description);
			assert.equal(section.links.length, expectedLinks);
		}
	}
});
