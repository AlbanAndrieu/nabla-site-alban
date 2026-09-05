import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

type Messages = {
	jm: {
		"4years": Record<string, unknown>;
		relatedDocuments: Array<{
			externalLink?: Record<string, unknown>;
		}>;
		footer?: unknown;
		[key: string]: unknown;
	};
};

async function load(locale: "en" | "fr"): Promise<Messages> {
	return JSON.parse(await readFile(`messages/${locale}.json`, "utf8")) as Messages;
}

test("Jus Mundi translations keep the active EN/FR contract without retired page copy", async () => {
	const [en, fr] = await Promise.all([load("en"), load("fr")]);
	const expectedReviewKeys = [
		"executive_copy",
		"executive_title",
		"headline",
		"key_achievements",
		"lead",
	];

	for (const messages of [en, fr]) {
		assert.deepEqual(Object.keys(messages.jm["4years"]).sort(), expectedReviewKeys);
		assert.equal(messages.jm.footer, undefined);
		for (const doc of messages.jm.relatedDocuments) {
			if (!doc.externalLink) continue;
			assert.deepEqual(
				Object.keys(doc.externalLink).sort(),
				["href", "label"],
			);
		}
	}

	assert.deepEqual(Object.keys(en.jm).sort(), Object.keys(fr.jm).sort());
});
