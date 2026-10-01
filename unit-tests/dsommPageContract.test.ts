import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

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

test("DSOMM snapshot is a pinned static OWASP model with stable activity identities", async () => {
	const snapshot = JSON.parse(await readFile(snapshotPath, "utf8")) as {
		source: {
			version: string;
			released: string;
			snapshotDate: string;
			sourceCommit: string;
			license: string;
		};
		dimensions: string[];
		activities: Array<{
			uuid: string;
			level: number;
			dimension: string;
			measure: string;
			references: Record<string, string[]>;
		}>;
	};

	assert.equal(snapshot.source.version, "5.0.2");
	assert.equal(snapshot.source.released, "2026-09-17");
	assert.equal(snapshot.source.snapshotDate, "2026-10-01");
	assert.match(snapshot.source.sourceCommit, /^[0-9a-f]{40}$/);
	assert.equal(snapshot.source.license, "GPL-3.0");
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
	assert.ok(snapshot.activities.some((activity) => activity.measure));
	assert.ok(snapshot.activities.some((activity) => !activity.measure));
	assert.ok(
		snapshot.activities.some(
			(activity) => activity.references["iso27001-2022"]?.length > 0,
		),
	);
});

test("DSOMM page renders the local snapshot without database, iframe or runtime fetch", async () => {
	const [page, explorer, resources] = await Promise.all([
		readFile(pagePath, "utf8"),
		readFile(explorerPath, "utf8"),
		readFile(resourcesPath, "utf8"),
	]);

	assert.match(page, /DSOMM_SNAPSHOT/);
	assert.match(page, /canonicalPagePath\("security\/dsomm"/);
	assert.match(page, /canonicalPageAlternates\("security\/dsomm"\)/);
	assert.doesNotMatch(page, /fetch\(/);
	assert.doesNotMatch(page, /<iframe/i);
	assert.doesNotMatch(explorer, /fetch\(/);
	assert.doesNotMatch(explorer, /<iframe/i);
	assert.match(resources, /page: "security\/dsomm"/);
});

test("DSOMM explorer exposes the planned static discovery filters", async () => {
	const explorer = await readFile(explorerPath, "utf8");

	for (const state of [
		"query",
		"dimension",
		"level",
		"framework",
		"tag",
	] as const) {
		assert.match(explorer, new RegExp(`useState\\(`));
		assert.match(explorer, new RegExp(state));
	}
	assert.match(explorer, /INITIAL_ACTIVITY_LIMIT/);
	assert.match(explorer, /activity\.references/);
	assert.match(explorer, /activity\.difficultyOfImplementation/);
});
