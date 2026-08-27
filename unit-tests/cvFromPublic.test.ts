import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
	loadCvHtmlFragment,
	metadataFromCvHtml,
	removeLegacyCvBackLink,
	resolveCvPublicFilePath,
} from "../lib/cvFromPublic";

test("resolveCvPublicFilePath only resolves allowlisted CV documents", async () => {
	assert.match(
		(await resolveCvPublicFilePath(["cv-small-en.html"], "en")) ?? "",
		/public\/cv\/cv-small-en\.html$/,
	);
	assert.equal(
		await resolveCvPublicFilePath(["..", "package.json"], "en"),
		null,
	);
});

test("removeLegacyCvBackLink removes the old partially styled anchor", () => {
	const html =
		'<p>CV content</p><a href="/cv" class="other back-link legacy">← Back to CV index</a>';
	const cleaned = removeLegacyCvBackLink(html);

	assert.match(cleaned, /CV content/);
	assert.doesNotMatch(cleaned, /back-link/);
	assert.doesNotMatch(cleaned, /Back to CV index/);
});

test("loadCvHtmlFragment extracts the body and removes legacy navigation and back action", async () => {
	for (const file of [
		"cv-small-en.html",
		"cv-medium-de.html",
		"cv-large-fr.html",
		"cv-full-no.html",
	]) {
		const { html } = await loadCvHtmlFragment([file], "en");
		assert.doesNotMatch(html, /<body\b/i);
		assert.doesNotMatch(html, /<nav\b[^>]*\bpage-nav\b/i);
		assert.doesNotMatch(html, /class=["'][^"']*\bback-link\b/i);
		assert.match(html, /Alban Andrieu/i);
	}
});

test("detailed CV route uses the shared design-system action for the whole button", async () => {
	const source = await readFile("app/[locale]/cv/[...path]/page.tsx", "utf8");

	assert.match(
		source,
		/import ActionLink from "@\/components\/ui\/ActionLink"/,
	);
	assert.match(source, /<ActionLink href=\{cvIndexHref\} variant="primary">/);
	assert.doesNotMatch(source, /className="back-link"/);
	assert.match(source, /de: "Zurück zum Lebenslauf-Index"/);
	assert.match(source, /fr: "Retour à l’index du CV"/);
	assert.match(source, /no: "Tilbake til CV-oversikten"/);
});

test("metadataFromCvHtml exposes the requested canonical URL", async () => {
	const metadata = await metadataFromCvHtml(
		["cv-small-fr.html"],
		"/fr/cv/cv-small-fr.html",
		"fr",
	);

	assert.equal(
		metadata.alternates?.canonical,
		"https://albanandrieu.com/fr/cv/cv-small-fr.html",
	);
});
