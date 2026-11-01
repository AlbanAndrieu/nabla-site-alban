import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { GLOSSARY_CATEGORIES } from "../app/[locale]/security/lexique/glossary";
import { loadConfig, scanText } from "../scripts/security/nda-guard.mjs";

type TermCopy = {
	acronym: string;
	expansion: string;
	question: string;
	definition: string[];
	points?: string[];
	note?: string;
};

type GlossaryCopy = {
	meta: { title: string; description: string };
	categories: Record<
		string,
		{ title: string; terms: Record<string, TermCopy> }
	>;
};

async function loadGlossary(locale: "en" | "fr"): Promise<GlossaryCopy> {
	const raw = await readFile(
		new URL(`../messages/security/${locale}.json`, import.meta.url),
		"utf8",
	);
	return JSON.parse(raw).securityGlossaryPage;
}

test("glossary copy matches the structure in both locales", async () => {
	for (const locale of ["en", "fr"] as const) {
		const copy = await loadGlossary(locale);
		assert.ok(copy.meta.title, `${locale}: meta title`);
		assert.ok(copy.meta.description, `${locale}: meta description`);
		assert.deepEqual(
			Object.keys(copy.categories),
			GLOSSARY_CATEGORIES.map((category) => category.id),
			`${locale}: category order`,
		);
		for (const category of GLOSSARY_CATEGORIES) {
			const categoryCopy = copy.categories[category.id];
			assert.ok(categoryCopy.title, `${locale}:${category.id} title`);
			assert.deepEqual(
				Object.keys(categoryCopy.terms),
				category.terms.map((term) => term.id),
				`${locale}:${category.id} term order`,
			);
			for (const term of category.terms) {
				const termCopy = categoryCopy.terms[term.id];
				assert.ok(termCopy.acronym, `${locale}:${term.id} acronym`);
				assert.ok(termCopy.expansion, `${locale}:${term.id} expansion`);
				assert.ok(termCopy.question, `${locale}:${term.id} question`);
				assert.ok(
					termCopy.definition.length > 0 && termCopy.definition.every(Boolean),
					`${locale}:${term.id} definition`,
				);
			}
		}
	}
});

test("glossary acronyms are identical across locales", async () => {
	const [en, fr] = await Promise.all([loadGlossary("en"), loadGlossary("fr")]);
	for (const category of GLOSSARY_CATEGORIES) {
		for (const term of category.terms) {
			assert.equal(
				en.categories[category.id].terms[term.id].acronym,
				fr.categories[category.id].terms[term.id].acronym,
				`${term.id} acronym`,
			);
		}
	}
});

test("glossary term anchors are unique and sources are HTTPS", () => {
	const ids = GLOSSARY_CATEGORIES.flatMap((category) =>
		category.terms.map((term) => term.id),
	);
	assert.equal(new Set(ids).size, ids.length, "duplicate term id");
	for (const category of GLOSSARY_CATEGORIES) {
		for (const term of category.terms) {
			for (const source of "sources" in term ? term.sources : []) {
				assert.match(source.href, /^https:\/\//, `${term.id} source`);
				assert.ok(source.label, `${term.id} source label`);
			}
		}
	}
});

test("public glossary contains no employer-internal references", async () => {
	const config = loadConfig();
	for (const locale of ["en", "fr"] as const) {
		const copy = JSON.stringify(await loadGlossary(locale));
		assert.deepEqual(scanText(`glossary-${locale}`, copy, config), []);
	}
	assert.deepEqual(
		scanText("glossary-structure", JSON.stringify(GLOSSARY_CATEGORIES), config),
		[],
	);
});
