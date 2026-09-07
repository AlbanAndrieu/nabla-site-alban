import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("active professional copy is consistent across home and contact", async () => {
	const [heroSource, enRaw, frRaw, legacyEn, legacyFr] = await Promise.all([
		readFile("app/components/Hero.tsx", "utf8"),
		readFile("messages/en.json", "utf8"),
		readFile("messages/fr.json", "utf8"),
		readFile("public/index.html", "utf8"),
		readFile("public/locales/fr/index.html", "utf8"),
	]);
	const en = JSON.parse(enRaw);
	const fr = JSON.parse(frRaw);

	assert.equal(en.home.timeline.freelance.date, "Freelance since 2007");
	assert.equal(fr.home.timeline.freelance.date, "Freelance depuis 2007");
	assert.equal(en.home.timeline.architect.date, "2022 – 2026");
	assert.equal(fr.home.timeline.architect.date, "2022 – 2026");
	assert.match(en.home.timeline.freelance.title, /Independent \/ Freelance/);
	assert.match(fr.home.timeline.freelance.title, /indépendant \/ freelance/);
	assert.match(en.contactPage.role, /Independent \/ Freelance/);
	assert.match(fr.contactPage.role, /indépendant \/ freelance/);
	assert.match(legacyEn, /Freelance since 2007/);
	assert.match(legacyFr, /Freelance depuis 2007/);
	assert.match(legacyEn, />2022 – 2026<\/time>/);
	assert.match(legacyFr, />2022 – 2026<\/time>/);
	assert.doesNotMatch(legacyEn, /Freelance - Coming soon|March 2022 – Present/);
	assert.doesNotMatch(legacyFr, /Freelance - À venir|2022 – Présent/);
	assert.doesNotMatch(heroSource, /lastexp/);
	for (const messages of [en, fr]) {
		assert.equal("lastexp" in messages.home.hero, false);
		assert.equal("jusmundi" in messages.home.hero, false);
		assert.equal("purpose" in messages.home.hero, false);
		for (const key of ["value1", "value2", "value3", "value4"]) assert.equal(typeof messages.home.hero[key], "string");
	}
});


test("current CV sources close the Jus Mundi period in 2026", async () => {
	const htmlPaths = [
		"cv-small-en.html",
		"cv-small-fr.html",
		"cv-small-de.html",
		"cv-small-no.html",
		"cv-medium-en.html",
		"cv-medium-fr.html",
		"cv-medium-de.html",
		"cv-medium-no.html",
		"cv-large-en.html",
		"cv-large-fr.html",
		"cv-large-de.html",
		"cv-large-no.html",
		"cv-full-en.html",
		"cv-full-fr.html",
		"cv-full-de.html",
		"cv-full-no.html",
	];

	for (const filename of htmlPaths) {
		const source = await readFile(`public/cv/${filename}`, "utf8");
		assert.match(source, /2022(?:-| – )2026/, filename);
		assert.doesNotMatch(
			source,
			/Since March 2022|Depuis mars 2022|Seit März 2022|Siden mars 2022|Since 2022 - 4\+ years|Depuis 2022 - 4\+ ans|Seit 2022 - 4\+ Jahre/,
			filename,
		);
	}

	for (const filename of [
		"cv-aandrieu-2026-03-29.json",
		"cv-aandrieu-2026-03-29-en.json",
		"cv-aandrieu-2026-03-29-fr.json",
		"cv-large-en-rx.json",
		"cv-large-fr-rx.json",
		"cv-full-en-rx.json",
		"cv-full-fr-rx.json",
	]) {
		const source = await readFile(`public/cv/${filename}`, "utf8");
		assert.match(source, /"period": "2022-2026"/, filename);
		assert.doesNotMatch(source, /"period": "2022 - Present"/, filename);
	}

	for (const filename of [
		"cv-aandrieu-2026-en.tex",
		"cv-aandrieu-2026-fr.tex",
		"cv-aandrieu-2026-de.tex",
		"cv-aandrieu-2026-no.tex",
	]) {
		const source = await readFile(`public/cv/${filename}`, "utf8");
		assert.match(source, /\\cventry\{2022-2026\}/, filename);
	}

	for (const filename of [
		"cv-aandrieu-2026-ts-en.tex",
		"cv-aandrieu-2026-ts-fr.tex",
		"cv-aandrieu-2026-ts-de.tex",
		"cv-aandrieu-2026-ts-no.tex",
	]) {
		const source = await readFile(`public/cv/${filename}`, "utf8");
		assert.match(source, /\{2026 -\}[\s\S]*\{2022\}[\s\S]*Jus Mundi/, filename);
		assert.doesNotMatch(source, /\{(?:Present|Présent|Heute|Nå) -\}[\s\S]*\{2022\}/, filename);
	}
});
