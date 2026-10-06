import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

import {
	DSOMM_REPOSITORY_ASSESSMENT,
	dsommAssessmentStats,
	validateDsommRepositoryAssessment,
} from "../lib/dsommAssessment";
import { DSOMM_SNAPSHOT } from "../lib/dsommSnapshot";

const canonicalPath = new URL(
	"../nabla-dsomm-assessment.json",
	import.meta.url,
);
const publicPath = new URL(
	"../public/.well-known/nabla/dsomm-assessment.json",
	import.meta.url,
);
const schemaPath = new URL(
	"../nabla-dsomm-assessment.schema.json",
	import.meta.url,
);
const publicSchemaPath = new URL(
	"../public/.well-known/nabla/dsomm-assessment.schema.json",
	import.meta.url,
);

test("DSOMM repository assessment is valid and pinned to the local model", () => {
	const assessment = validateDsommRepositoryAssessment(
		structuredClone(DSOMM_REPOSITORY_ASSESSMENT),
	);
	assert.equal(assessment.schemaVersion, 1);
	assert.equal(assessment.contract, "nabla.dsomm.repository-assessment/v1");
	assert.equal(assessment.subject.repository, "AlbanAndrieu/nabla-site-alban");
	assert.equal(assessment.model.version, DSOMM_SNAPSHOT.source.version);
	assert.equal(
		assessment.model.sourceCommit,
		DSOMM_SNAPSHOT.source.sourceCommit,
	);
	assert.equal(assessment.aggregation.missingClaim, "not-assessed");
	assert.equal(
		assessment.aggregation.modelCompatibility,
		"exact-source-commit",
	);
});

test("DSOMM assessment public artifacts exactly mirror the canonical producer contract", async () => {
	const [canonical, published, schema, publishedSchema] = await Promise.all([
		readFile(canonicalPath, "utf8"),
		readFile(publicPath, "utf8"),
		readFile(schemaPath, "utf8"),
		readFile(publicSchemaPath, "utf8"),
	]);
	assert.equal(published, canonical);
	assert.equal(publishedSchema, schema);
});

test("DSOMM assessment repository evidence paths exist", async () => {
	for (const evidence of DSOMM_REPOSITORY_ASSESSMENT.evidence) {
		if (!("path" in evidence) || !evidence.path) continue;
		await access(new URL(`../${evidence.path}`, import.meta.url));
	}
});

test("DSOMM claims use unique model UUIDs and resolvable evidence references", () => {
	const claims = DSOMM_REPOSITORY_ASSESSMENT.claims;
	assert.equal(
		new Set(claims.map((claim) => claim.activityUuid)).size,
		claims.length,
	);
	const modelIds = new Set(
		DSOMM_SNAPSHOT.activities.map((activity) => activity.uuid),
	);
	const evidenceIds = new Set(
		DSOMM_REPOSITORY_ASSESSMENT.evidence.map((entry) => entry.id),
	);
	for (const claim of claims) {
		assert.ok(modelIds.has(claim.activityUuid));
		assert.ok(claim.evidenceRefs.every((ref) => evidenceIds.has(ref)));
		if (claim.applicability === "not-applicable") {
			assert.equal(claim.progress, null);
			assert.equal(claim.score, null);
		} else {
			assert.notEqual(claim.progress, null);
			assert.notEqual(claim.score, null);
		}
	}
});

test("DSOMM assessment keeps explicit strengths, gaps and N/A semantics", () => {
	const byName = new Map(
		DSOMM_REPOSITORY_ASSESSMENT.claims.map((claim) => [
			claim.activityName,
			claim,
		]),
	);
	assert.equal(byName.get("Defined build process")?.score, 1);
	assert.equal(byName.get("SBOM of components")?.score, 0);
	assert.equal(byName.get("Require a PR before merging")?.score, 0.5);
	assert.equal(byName.get("Block force pushes")?.score, 0);
	assert.equal(
		byName.get("Static and dynamic analysis of AI generated code")?.score,
		1,
	);
	assert.equal(
		byName.get("Hallucination detection for AI responses")?.applicability,
		"not-applicable",
	);
});

test("DSOMM stats expose assessment coverage separately from average progress", () => {
	const stats = dsommAssessmentStats();
	assert.equal(stats.assessed, DSOMM_REPOSITORY_ASSESSMENT.claims.length);
	assert.equal(
		stats.applicable + stats.notApplicable,
		DSOMM_REPOSITORY_ASSESSMENT.claims.length,
	);
	assert.equal(stats.modelActivities, DSOMM_SNAPSHOT.activities.length);
	assert.ok(stats.coverage > 0);
	assert.ok(stats.coverage < 1);
	assert.ok(stats.averageProgress !== null);
	assert.ok(stats.averageProgress! >= 0 && stats.averageProgress! <= 1);
});
