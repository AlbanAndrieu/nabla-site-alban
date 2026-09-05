import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("shared contact hero does not carry an obsolete current-employer prop", async () => {
	const [hero, contact, cv, enRaw, frRaw] = await Promise.all([
		readFile("components/ContactHero.tsx", "utf8"),
		readFile("app/[locale]/contact/page.tsx", "utf8"),
		readFile("app/[locale]/cv/page.tsx", "utf8"),
		readFile("messages/en.json", "utf8"),
		readFile("messages/fr.json", "utf8"),
	]);

	assert.doesNotMatch(hero, /current:\s*string/);
	assert.doesNotMatch(contact, /hero\.current/);
	assert.doesNotMatch(cv, /hero\.current/);

	for (const raw of [enRaw, frRaw]) {
		const messages = JSON.parse(raw) as {
			contactPage?: { hero?: Record<string, unknown> };
		};
		assert.equal(messages.contactPage?.hero?.current, undefined);
	}
});
