import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { DSOMM_SNAPSHOT, validateDsommSnapshot } from "../lib/dsommSnapshot";
import { localizeDsommSnapshot } from "../lib/dsommTranslation";

const snapshotPath = new URL(
	"../data/security/dsomm/model.snapshot.json",
	import.meta.url,
);
const pagePath = new URL(
	"../app/[locale]/security/dsomm/page.tsx",
	import.meta.url,
);
const explorerPath = new URL(
	"../app/[locale]/security/dsomm/DsommExplorer.tsx",
	import.meta.url,
);
const resourcesPath = new URL(
	"../app/[locale]/security/securityResources.ts",
	import.meta.url,
);

function cloneSnapshot() {
	return structuredClone(DSOMM_SNAPSHOT);
}

test("DSOMM snapshot is a pinned static OWASP model with stable activity identities", async () => {
	const snapshot = JSON.parse(
		await readFile(snapshotPath, "utf8"),
	) as typeof DSOMM_SNAPSHOT;

	assert.equal(snapshot.source.version, "5.0.2");
	assert.equal(snapshot.source.released, "2026-09-17");
	assert.equal(snapshot.source.snapshotDate, "2026-10-01");
	assert.match(snapshot.source.sourceCommit, /^[0-9a-f]{40}$/);
	assert.equal(snapshot.source.license, "GPL-3.0");
	assert.ok(snapshot.source.upstreamUrl.includes(snapshot.source.sourceCommit));
	assert.ok(snapshot.source.licenseUrl.includes(snapshot.source.sourceCommit));
	assert.equal(snapshot.dimensions.length, 6);
	assert.equal(snapshot.activities.length, 251);
	assert.equal(
		new Set(snapshot.activities.map((activity) => activity.uuid)).size,
		snapshot.activities.length,
	);
	assert.deepEqual(
		[...new Set(snapshot.activities.map((activity) => activity.level))].sort(),
		[1, 2, 3, 4, 5],
	);

	const dimensions = new Set(snapshot.dimensions);
	for (const activity of snapshot.activities) {
		assert.match(
			activity.uuid,
			/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?:-(?:medium|advanced))?$/i,
		);
		assert.ok(dimensions.has(activity.dimension));
		assert.ok(activity.level >= 1 && activity.level <= 5);
		if (activity.usefulness !== null) {
			assert.ok(activity.usefulness >= 1 && activity.usefulness <= 5);
		}
		for (const score of Object.values(activity.difficultyOfImplementation)) {
			assert.ok(score >= 1 && score <= 5);
		}
		assert.ok(activity.tags.every((tag) => typeof tag === "string"));
		for (const references of Object.values(activity.references)) {
			assert.ok(references.every((reference) => typeof reference === "string"));
		}
	}
});

test("DSOMM validator fails closed on malformed provenance", () => {
	const badSha = cloneSnapshot();
	badSha.source.sourceCommit = "main";
	assert.throws(() => validateDsommSnapshot(badSha), /full Git SHA/);

	const wrongRepository = cloneSnapshot();
	wrongRepository.source.repository = "example/other-model";
	assert.throws(
		() => validateDsommSnapshot(wrongRepository),
		/canonical OWASP DSOMM provenance/,
	);

	const impossibleRelease = cloneSnapshot();
	impossibleRelease.source.released = "2026-02-31";
	assert.throws(
		() => validateDsommSnapshot(impossibleRelease),
		/real calendar date/,
	);

	const unpinnedSource = cloneSnapshot();
	unpinnedSource.source.upstreamUrl =
		"https://github.com/devsecopsmaturitymodel/DevSecOps-MaturityModel-data/blob/main/generated/model.yaml";
	assert.throws(
		() => validateDsommSnapshot(unpinnedSource),
		/pinned to source\.sourceCommit/,
	);
});

test("DSOMM validator rejects incomplete normalized data", () => {
	const emptyTag = cloneSnapshot();
	emptyTag.activities[0].tags = [""];
	assert.throws(
		() => validateDsommSnapshot(emptyTag),
		/non-empty-string array/,
	);

	const orphanDimension = cloneSnapshot();
	orphanDimension.dimensions.push("Orphan dimension");
	assert.throws(
		() => validateDsommSnapshot(orphanDimension),
		/must contain at least one activity/,
	);

	const impossibleSnapshotDate = cloneSnapshot();
	impossibleSnapshotDate.source.snapshotDate = "2026-09-01";
	assert.throws(
		() => validateDsommSnapshot(impossibleSnapshotDate),
		/must not predate/,
	);
});

test("DSOMM validator rejects broken model identities and scores", () => {
	const duplicate = cloneSnapshot();
	duplicate.activities[1].uuid = duplicate.activities[0].uuid;
	assert.throws(
		() => validateDsommSnapshot(duplicate),
		/duplicate activity UUID/,
	);

	const unknownDimension = cloneSnapshot();
	unknownDimension.activities[0].dimension = "Unknown dimension";
	assert.throws(
		() => validateDsommSnapshot(unknownDimension),
		/dimension must exist in dimensions/,
	);

	const invalidLevel = cloneSnapshot();
	invalidLevel.activities[0].level = 6;
	assert.throws(
		() => validateDsommSnapshot(invalidLevel),
		/integer from 1 to 5/,
	);
});

test("DSOMM page renders the local snapshot without database, iframe or runtime fetch", async () => {
	const [page, explorer, resources] = await Promise.all([
		readFile(pagePath, "utf8"),
		readFile(explorerPath, "utf8"),
		readFile(resourcesPath, "utf8"),
	]);

	assert.match(page, /DSOMM_SNAPSHOT/);
	assert.match(page, /DsommAssessmentHeatmap/);
	assert.match(page, /canonicalPagePath\("security\/dsomm"/);
	assert.match(page, /canonicalPageAlternates\("security\/dsomm"\)/);
	assert.match(page, /summary\.dimensionCoverage/);
	assert.doesNotMatch(page, /languageSwitcherLabel/);
	assert.doesNotMatch(page, /canonicalPagePath\("security\/dsomm", "en"\)/);
	assert.doesNotMatch(page, /canonicalPagePath\("security\/dsomm", "fr"\)/);
	assert.match(page, /localizeDsommSnapshot/);
	assert.doesNotMatch(page, /fetch\(/);
	assert.doesNotMatch(page, /<iframe/i);
	assert.doesNotMatch(explorer, /fetch\(/);
	assert.doesNotMatch(explorer, /<iframe/i);
	assert.match(resources, /page: "security\/dsomm"/);
});

test("DSOMM explorer exposes bounded filters and an explicit reset", async () => {
	const explorer = await readFile(explorerPath, "utf8");

	for (const state of [
		"query",
		"dimension",
		"level",
		"framework",
		"tag",
	] as const) {
		assert.match(explorer, /useState\(/);
		assert.match(explorer, new RegExp(state));
	}
	assert.match(explorer, /INITIAL_ACTIVITY_LIMIT/);
	assert.match(explorer, /activity\.references/);
	assert.match(explorer, /activity\.difficultyOfImplementation/);
	assert.match(explorer, /hasActiveFilters/);
	assert.match(explorer, /clearFilters/);
});


test("French DSOMM translation covers every upstream activity without changing identities", () => {
	const localized = localizeDsommSnapshot("fr");
	assert.equal(localized.activities.length, DSOMM_SNAPSHOT.activities.length);
	assert.deepEqual(
		localized.activities.map((activity) => activity.uuid),
		DSOMM_SNAPSHOT.activities.map((activity) => activity.uuid),
	);
	const changedNames = localized.activities.filter(
		(activity, index) =>
			activity.name !== DSOMM_SNAPSHOT.activities[index].name,
	).length;
	assert.ok(changedNames >= 240);
	assert.equal(
		localized.activities.find(
			(activity) =>
				activity.uuid === "dc62d384-0b9c-47d9-b7a5-9d82e53642ba",
		)?.name,
		"Prévention de base contre les fuites de données",
	);
	assert.equal(
		localized.activities.find(
			(activity) =>
				activity.uuid === "2244983e-5279-4a6c-b594-155a5d26ebc2",
		)?.name,
		"Appliquer une autorisation côté serveur à chaque requête",
	);
});
