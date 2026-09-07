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
