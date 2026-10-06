import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { DSOMM_REPOSITORY_ASSESSMENT } from "../lib/dsommAssessment";
import { buildDsommHeatmapData } from "../lib/dsommHeatmap";
import { DSOMM_SNAPSHOT } from "../lib/dsommSnapshot";

test("circular heatmap has exactly one status per official DSOMM activity", () => {
	const data = buildDsommHeatmapData();
	assert.equal(data.modelActivities, 251);
	assert.equal(data.activities.length, DSOMM_SNAPSHOT.activities.length);
	assert.equal(
		new Set(data.activities.map((activity) => activity.uuid)).size,
		data.modelActivities,
	);
	assert.equal(
		data.assessed + data.notAssessed,
		data.modelActivities,
	);
	assert.equal(
		data.applicable + data.notApplicable,
		data.assessed,
	);
	assert.equal(data.notApplicable, 3);
	assert.equal(data.assessed, DSOMM_REPOSITORY_ASSESSMENT.claims.length);
});

test("circular heatmap separates assessment coverage from scored maturity", () => {
	const data = buildDsommHeatmapData();
	assert.equal(data.coverage, data.assessed / data.modelActivities);
	assert.ok(data.coverage < 1);
	assert.notEqual(data.coverage, data.averageProgress);
	assert.equal(
		data.dimensions.reduce((sum, dimension) => sum + dimension.assessed, 0),
		data.assessed,
	);
	assert.equal(
		data.dimensions.reduce(
			(sum, dimension) => sum + dimension.modelActivities,
			0,
		),
		data.modelActivities,
	);
	assert.equal(
		data.dimensions.reduce(
			(sum, dimension) => sum + dimension.notAssessed,
			0,
		),
		data.notAssessed,
	);
});

test("circular heatmap renders explicit zero, N/A and missing statuses", () => {
	const status = new Map(
		buildDsommHeatmapData().activities.map((activity) => [
			activity.uuid,
			activity.status,
		]),
	);
	const byName = new Map(
		DSOMM_REPOSITORY_ASSESSMENT.claims.map((claim) => [
			claim.activityName,
			claim.activityUuid,
		]),
	);
	assert.equal(status.get(byName.get("SBOM of components")), "not-implemented");
	assert.equal(
		status.get(byName.get("Hallucination detection for AI responses")),
		"not-applicable",
	);
	const assessedIds = new Set(
		DSOMM_REPOSITORY_ASSESSMENT.claims.map((claim) => claim.activityUuid),
	);
	const unassessed = DSOMM_SNAPSHOT.activities.find(
		(activity) => !assessedIds.has(activity.uuid),
	);
	assert.ok(unassessed);
	assert.equal(status.get(unassessed.uuid), "not-assessed");
});

test("circular heatmap remains server-rendered, localized and accessible", async () => {
	const [page, component] = await Promise.all([
		readFile(
			new URL("../app/[locale]/security/dsomm/page.tsx", import.meta.url),
			"utf8",
		),
		readFile(
			new URL(
				"../app/[locale]/security/dsomm/DsommAssessmentHeatmap.tsx",
				import.meta.url,
			),
			"utf8",
		),
	]);
	assert.match(page, /DsommAssessmentHeatmap/);
	assert.match(page, /t\.raw\("assessment"\)/);
	assert.match(component, /aria-labelledby="dsomm-assessment-heading"/);
	assert.match(component, /<table/);
	assert.match(component, /scope="row"/);
	assert.match(component, /aria-hidden="true"/);
	assert.doesNotMatch(component, /"use client"/);
	assert.doesNotMatch(component, /fetch\(/);
});
