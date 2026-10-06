import { DSOMM_SNAPSHOT, type DsommSnapshot } from "@/lib/dsommSnapshot";
import assessment from "@/nabla-dsomm-assessment.json";

export const DSOMM_ASSESSMENT_CONTRACT =
	"nabla.dsomm.repository-assessment/v1" as const;

export type DsommProgress =
	| "not-implemented"
	| "started"
	| "partly-implemented"
	| "fully-implemented";
export type DsommApplicability = "applicable" | "not-applicable";
export type DsommAssessmentScope =
	| "repository"
	| "development-process"
	| "runtime"
	| "governance";
export type DsommEvidenceVisibility = "public" | "restricted";

export type DsommAssessmentEvidence = {
	id: string;
	type:
		| "repository"
		| "workflow"
		| "test"
		| "documentation"
		| "policy"
		| "notion";
	visibility: DsommEvidenceVisibility;
	title: string;
	description: string;
	path?: string;
	url?: string;
};

export type DsommAssessmentClaim = {
	activityUuid: string;
	activityName: string;
	dimension: string;
	level: number;
	applicability: DsommApplicability;
	progress: DsommProgress | null;
	score: 0 | 0.2 | 0.5 | 1 | null;
	scope: DsommAssessmentScope;
	confidence: "low" | "medium" | "high";
	rationale: string;
	evidenceRefs: string[];
};

export type DsommRepositoryAssessment = {
	$schema: string;
	schemaVersion: 1;
	contract: typeof DSOMM_ASSESSMENT_CONTRACT;
	subject: {
		kind: "repository";
		repository: string;
		defaultBranch: string;
		url: string;
	};
	assessment: {
		id: string;
		assessedAt: string;
		basisRevision: string;
		method: "evidence-based-self-assessment";
		reviewStatus: "self-assessed" | "reviewed" | "independently-reviewed";
		scope: string;
	};
	model: {
		project: string;
		version: string;
		sourceCommit: string;
		activityIdentity: "uuid";
	};
	progressDefinition: Record<DsommProgress, 0 | 0.2 | 0.5 | 1>;
	aggregation: {
		identity: "activityUuid";
		excludeApplicability: ["not-applicable"];
		missingClaim: "not-assessed";
		modelCompatibility: "exact-source-commit";
		recommendedPortfolioStrategy: "mean-of-applicable-repository-scores";
		notes: string;
	};
	evidence: DsommAssessmentEvidence[];
	claims: DsommAssessmentClaim[];
};

const ACTIVITY_ID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?:-(?:medium|advanced))?$/i;
const SHA_PATTERN = /^[0-9a-f]{40}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const REPOSITORY_PATTERN = /^[^/]+\/[^/]+$/;
const EVIDENCE_ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const PROGRESS_SCORES: Record<DsommProgress, 0 | 0.2 | 0.5 | 1> = {
	"not-implemented": 0,
	started: 0.2,
	"partly-implemented": 0.5,
	"fully-implemented": 1,
};

function invalid(message: string): never {
	throw new Error(`Invalid DSOMM repository assessment: ${message}`);
}

function record(value: unknown, label: string): Record<string, unknown> {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		invalid(`${label} must be an object`);
	}
	return value as Record<string, unknown>;
}

function text(value: unknown, label: string): string {
	if (typeof value !== "string" || value.length === 0) {
		invalid(`${label} must be a non-empty string`);
	}
	return value;
}

function isoDate(value: unknown, label: string): string {
	const date = text(value, label);
	if (!DATE_PATTERN.test(date)) invalid(`${label} must use YYYY-MM-DD`);
	const parsed = new Date(`${date}T00:00:00Z`);
	if (
		Number.isNaN(parsed.getTime()) ||
		parsed.toISOString().slice(0, 10) !== date
	) {
		invalid(`${label} must be a real calendar date`);
	}
	return date;
}

function oneOf<T extends string>(
	value: unknown,
	allowed: readonly T[],
	label: string,
): T {
	if (typeof value !== "string" || !allowed.includes(value as T)) {
		invalid(`${label} must be one of: ${allowed.join(", ")}`);
	}
	return value as T;
}

export function validateDsommRepositoryAssessment(
	value: unknown,
	model: DsommSnapshot = DSOMM_SNAPSHOT,
): DsommRepositoryAssessment {
	const root = record(value, "root");
	if (root.$schema !== "./nabla-dsomm-assessment.schema.json") {
		invalid("$schema must reference the versioned repository schema");
	}
	if (root.schemaVersion !== 1) invalid("schemaVersion must be 1");
	if (root.contract !== DSOMM_ASSESSMENT_CONTRACT) {
		invalid(`contract must be ${DSOMM_ASSESSMENT_CONTRACT}`);
	}

	const subject = record(root.subject, "subject");
	if (subject.kind !== "repository") invalid("subject.kind must be repository");
	const repository = text(subject.repository, "subject.repository");
	if (!REPOSITORY_PATTERN.test(repository)) {
		invalid("subject.repository must use owner/name");
	}
	text(subject.defaultBranch, "subject.defaultBranch");
	const subjectUrl = text(subject.url, "subject.url");
	if (subjectUrl !== `https://github.com/${repository}`) {
		invalid("subject.url must match subject.repository");
	}

	const assessmentInfo = record(root.assessment, "assessment");
	text(assessmentInfo.id, "assessment.id");
	isoDate(assessmentInfo.assessedAt, "assessment.assessedAt");
	const basisRevision = text(
		assessmentInfo.basisRevision,
		"assessment.basisRevision",
	);
	if (!SHA_PATTERN.test(basisRevision)) {
		invalid("assessment.basisRevision must be a full Git SHA");
	}
	if (assessmentInfo.method !== "evidence-based-self-assessment") {
		invalid("assessment.method must be evidence-based-self-assessment");
	}
	oneOf(
		assessmentInfo.reviewStatus,
		["self-assessed", "reviewed", "independently-reviewed"] as const,
		"assessment.reviewStatus",
	);
	text(assessmentInfo.scope, "assessment.scope");

	const modelRef = record(root.model, "model");
	if (modelRef.project !== model.source.project) {
		invalid("model.project must match the pinned DSOMM snapshot");
	}
	if (modelRef.version !== model.source.version) {
		invalid("model.version must match the pinned DSOMM snapshot");
	}
	if (modelRef.sourceCommit !== model.source.sourceCommit) {
		invalid("model.sourceCommit must match the pinned DSOMM snapshot");
	}
	if (modelRef.activityIdentity !== "uuid") {
		invalid("model.activityIdentity must be uuid");
	}

	const progressDefinition = record(
		root.progressDefinition,
		"progressDefinition",
	);
	for (const [progress, score] of Object.entries(PROGRESS_SCORES)) {
		if (progressDefinition[progress] !== score) {
			invalid(`progressDefinition.${progress} must be ${score}`);
		}
	}

	const aggregation = record(root.aggregation, "aggregation");
	if (aggregation.identity !== "activityUuid") {
		invalid("aggregation.identity must be activityUuid");
	}
	if (
		!Array.isArray(aggregation.excludeApplicability) ||
		aggregation.excludeApplicability.length !== 1 ||
		aggregation.excludeApplicability[0] !== "not-applicable"
	) {
		invalid("aggregation.excludeApplicability must contain not-applicable");
	}
	if (aggregation.missingClaim !== "not-assessed") {
		invalid("aggregation.missingClaim must be not-assessed");
	}
	if (aggregation.modelCompatibility !== "exact-source-commit") {
		invalid("aggregation.modelCompatibility must be exact-source-commit");
	}
	if (
		aggregation.recommendedPortfolioStrategy !==
		"mean-of-applicable-repository-scores"
	) {
		invalid(
			"aggregation.recommendedPortfolioStrategy must be mean-of-applicable-repository-scores",
		);
	}
	text(aggregation.notes, "aggregation.notes");

	if (!Array.isArray(root.evidence)) invalid("evidence must be an array");
	const evidenceIds = new Set<string>();
	for (const [index, rawEvidence] of root.evidence.entries()) {
		const item = record(rawEvidence, `evidence[${index}]`);
		const id = text(item.id, `evidence[${index}].id`);
		if (!EVIDENCE_ID_PATTERN.test(id)) {
			invalid(`evidence[${index}].id must be a stable slug`);
		}
		if (evidenceIds.has(id)) invalid(`duplicate evidence id ${id}`);
		evidenceIds.add(id);
		oneOf(
			item.type,
			[
				"repository",
				"workflow",
				"test",
				"documentation",
				"policy",
				"notion",
			] as const,
			`evidence[${index}].type`,
		);
		oneOf(
			item.visibility,
			["public", "restricted"] as const,
			`evidence[${index}].visibility`,
		);
		text(item.title, `evidence[${index}].title`);
		text(item.description, `evidence[${index}].description`);
		const hasPath = typeof item.path === "string" && item.path.length > 0;
		const hasUrl = typeof item.url === "string" && item.url.length > 0;
		if (hasPath === hasUrl) {
			invalid(`evidence[${index}] must define exactly one of path or url`);
		}
	}

	if (!Array.isArray(root.claims)) invalid("claims must be an array");
	const activityById = new Map(
		model.activities.map((activity) => [activity.uuid, activity]),
	);
	const claimIds = new Set<string>();
	for (const [index, rawClaim] of root.claims.entries()) {
		const item = record(rawClaim, `claims[${index}]`);
		const activityUuid = text(
			item.activityUuid,
			`claims[${index}].activityUuid`,
		);
		if (!ACTIVITY_ID_PATTERN.test(activityUuid)) {
			invalid(`claims[${index}].activityUuid is not a supported DSOMM UUID`);
		}
		if (claimIds.has(activityUuid)) {
			invalid(`duplicate claim for activity ${activityUuid}`);
		}
		claimIds.add(activityUuid);
		const activity = activityById.get(activityUuid);
		if (!activity) {
			invalid(`claim activity ${activityUuid} is absent from the pinned model`);
		}
		if (item.activityName !== activity.name) {
			invalid(`claim ${activityUuid} activityName does not match the model`);
		}
		if (item.dimension !== activity.dimension) {
			invalid(`claim ${activityUuid} dimension does not match the model`);
		}
		if (item.level !== activity.level) {
			invalid(`claim ${activityUuid} level does not match the model`);
		}

		const applicability = oneOf(
			item.applicability,
			["applicable", "not-applicable"] as const,
			`claims[${index}].applicability`,
		);
		oneOf(
			item.scope,
			["repository", "development-process", "runtime", "governance"] as const,
			`claims[${index}].scope`,
		);
		oneOf(
			item.confidence,
			["low", "medium", "high"] as const,
			`claims[${index}].confidence`,
		);
		text(item.rationale, `claims[${index}].rationale`);

		if (!Array.isArray(item.evidenceRefs) || item.evidenceRefs.length === 0) {
			invalid(`claims[${index}].evidenceRefs must be non-empty`);
		}
		for (const ref of item.evidenceRefs) {
			if (typeof ref !== "string" || !evidenceIds.has(ref)) {
				invalid(
					`claim ${activityUuid} references unknown evidence ${String(ref)}`,
				);
			}
		}

		if (applicability === "not-applicable") {
			if (item.progress !== null || item.score !== null) {
				invalid(
					`not-applicable claim ${activityUuid} must have null progress and score`,
				);
			}
			continue;
		}

		const progress = oneOf(
			item.progress,
			Object.keys(PROGRESS_SCORES) as DsommProgress[],
			`claims[${index}].progress`,
		);
		if (item.score !== PROGRESS_SCORES[progress]) {
			invalid(`claim ${activityUuid} score must match progress ${progress}`);
		}
	}

	return value as DsommRepositoryAssessment;
}

export const DSOMM_REPOSITORY_ASSESSMENT =
	validateDsommRepositoryAssessment(assessment);

export type DsommAssessmentDimensionStats = {
	dimension: string;
	assessed: number;
	applicable: number;
	notApplicable: number;
	averageProgress: number | null;
};

export function dsommAssessmentStats(
	value: DsommRepositoryAssessment = DSOMM_REPOSITORY_ASSESSMENT,
): {
	assessed: number;
	applicable: number;
	notApplicable: number;
	modelActivities: number;
	coverage: number;
	averageProgress: number | null;
	dimensions: DsommAssessmentDimensionStats[];
} {
	const applicableClaims = value.claims.filter(
		(claim) => claim.applicability === "applicable",
	);
	const scoreValues = applicableClaims.flatMap((claim) =>
		claim.score === null ? [] : [claim.score],
	);
	const dimensions = DSOMM_SNAPSHOT.dimensions.map((dimension) => {
		const claims = value.claims.filter(
			(claim) => claim.dimension === dimension,
		);
		const applicable = claims.filter(
			(claim) => claim.applicability === "applicable",
		);
		const scores = applicable.flatMap((claim) =>
			claim.score === null ? [] : [claim.score],
		);
		return {
			dimension,
			assessed: claims.length,
			applicable: applicable.length,
			notApplicable: claims.length - applicable.length,
			averageProgress:
				scores.length === 0
					? null
					: scores.reduce<number>((sum, score) => sum + score, 0) /
						scores.length,
		};
	});
	return {
		assessed: value.claims.length,
		applicable: applicableClaims.length,
		notApplicable: value.claims.length - applicableClaims.length,
		modelActivities: DSOMM_SNAPSHOT.activities.length,
		coverage: value.claims.length / DSOMM_SNAPSHOT.activities.length,
		averageProgress:
			scoreValues.length === 0
				? null
				: scoreValues.reduce<number>((sum, score) => sum + score, 0) /
					scoreValues.length,
		dimensions,
	};
}
