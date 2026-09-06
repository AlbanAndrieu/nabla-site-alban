import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("active professional copy is consistent across home and contact", async () => {
	const [heroSource, enRaw, frRaw] = await Promise.all([
		readFile("app/components/Hero.tsx", "utf8"),
		readFile("messages/en.json", "utf8"),
		readFile("messages/fr.json", "utf8"),
	]);
	const en = JSON.parse(enRaw);
	const fr = JSON.parse(frRaw);

	assert.equal(en.home.timeline.freelance.date, "Since 2026");
	assert.equal(fr.home.timeline.freelance.date, "Depuis 2026");
	assert.match(en.contactPage.role, /Independent/);
	assert.match(fr.contactPage.role, /indépendant/);
	assert.doesNotMatch(heroSource, /lastexp/);
	for (const messages of [en, fr]) {
		assert.equal("lastexp" in messages.home.hero, false);
		assert.equal("jusmundi" in messages.home.hero, false);
		assert.equal("purpose" in messages.home.hero, false);
		for (const key of ["value1", "value2", "value3", "value4"]) assert.equal(typeof messages.home.hero[key], "string");
	}
});
