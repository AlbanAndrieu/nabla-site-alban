import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { preserveCanonicalProductNames } from "../lib/htmlFromPublic";

const FORBIDDEN_TRANSLATED_PRODUCT_NAMES = [
	"N'importe quoiLLM",
	"Sans papier-ngx",
	"IA sans papier",
	"PDF sur Stirling",
	"OuvrirCommit",
	"Terminal ouvert",
	"Contexte7",
	"Super serveurs MCP",
	"Ouvrir l'interface Web",
	"Copilote GitHub",
	"Curseur",
	"Développeur Amazon Q",
	"Poussière",
	"Apprentissage automatique Azure",
	"Visage câlin",
	"LangChaîne",
	"PGvecteur",
	"Recherche élastique",
	"ÉquipageAI",
	"OuvrirRAG",
	"temporalio/temporel",
	"<b>Trafic</b>",
	"<b>Dockage</b>",
	"<b>Tour de guet</b>",
] as const;

function assertNoTranslatedProductNames(content: string, source: string) {
	for (const translated of FORBIDDEN_TRANSLATED_PRODUCT_NAMES) {
		assert.doesNotMatch(
			content,
			new RegExp(translated.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "u"),
			`${source} still renders machine-translated product name: ${translated}`,
		);
	}
}

test("French localized HTML renders canonical product names outside CV pages", async () => {
	const localizedDirectory = path.join(process.cwd(), "public/locales/fr");
	const files = (await readdir(localizedDirectory)).filter((file) =>
		file.endsWith(".html"),
	);

	assert.ok(
		files.length > 10,
		"expected the French localized page corpus to be audited",
	);

	for (const file of files) {
		const source = await readFile(path.join(localizedDirectory, file), "utf8");
		const rendered = preserveCanonicalProductNames(source, file, "fr");
		assertNoTranslatedProductNames(rendered, file);
	}
});

test("native French message catalogue does not translate canonical product names", async () => {
	const messages = await readFile(
		path.join(process.cwd(), "messages/fr.json"),
		"utf8",
	);
	assertNoTranslatedProductNames(messages, "messages/fr.json");
});

test("product-name normalization is French-only and explicitly excludes CV content", () => {
	assert.equal(
		preserveCanonicalProductNames("N'importe quoiLLM", "ai.html", "en"),
		"N'importe quoiLLM",
	);
	assert.equal(
		preserveCanonicalProductNames("N'importe quoiLLM", "cv/index.html", "fr"),
		"N'importe quoiLLM",
	);
	assert.equal(
		preserveCanonicalProductNames("N'importe quoiLLM", "ai.html", "fr"),
		"AnythingLLM",
	);
});
