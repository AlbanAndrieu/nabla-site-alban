import {
	DSOMM_REPOSITORY_ASSESSMENT,
	type DsommRepositoryAssessment,
	validateDsommRepositoryAssessment,
} from "@/lib/dsommAssessment";
import {
	DSOMM_SNAPSHOT,
	type DsommSnapshot,
} from "@/lib/dsommSnapshot";

export type DsommHeatmapStatus =
	| "not-assessed"
	| "not-applicable"
	| "not-implemented"
	| "started"
	| "partly-implemented"
	| "fully-implemented";

export type DsommHeatmapActivity = {
	uuid: string;
	dimension: string;
	status: DsommHeatmapStatus;
};

export type DsommHeatmapDimension = {
	dimension: string;
	modelActivities: number;
	assessed: number;
	applicable: number;
	notApplicable: number;
	notAssessed: number;
	coverage: number;
	averageProgress: number | null;
};

export type DsommHeatmapData = {
	activities: DsommHeatmapActivity[];
	dimensions: DsommHeatmapDimension[];
	modelActivities: number;
	assessed: number;
	applicable: number;
	notApplicable: number;
	notAssessed: number;
	coverage: number;
	averageProgress: number | null;
};

function mean(scores: number[]): number | null {
	if (scores.length === 0) return null;
	return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

export function buildDsommHeatmapData(
	snapshot: DsommSnapshot = DSOMM_SNAPSHOT,
	assessment: DsommRepositoryAssessment = DSOMM_REPOSITORY_ASSESSMENT,
): DsommHeatmapData {
	const validated = validateDsommRepositoryAssessment(assessment, snapshot);
	const claims = new Map(
		validated.claims.map((claim) => [claim.activityUuid, claim]),
	);

	const dimensions = snapshot.dimensions.map((dimension) => {
		const modelActivities = snapshot.activities.filter(
			(activity) => activity.dimension === dimension,
		);
		const dimensionClaims = modelActivities.flatMap((activity) => {
			const claim = claims.get(activity.uuid);
			return claim ? [claim] : [];
		});
		const scores = dimensionClaims.flatMap((claim) =>
			claim.applicability === "applicable" && claim.score !== null
				? [claim.score]
				: [],
		);
		const notApplicable = dimensionClaims.filter(
			(claim) => claim.applicability === "not-applicable",
		).length;
		return {
			dimension,
			modelActivities: modelActivities.length,
			assessed: dimensionClaims.length,
			applicable: scores.length,
			notApplicable,
			notAssessed: modelActivities.length - dimensionClaims.length,
			coverage: dimensionClaims.length / modelActivities.length,
			averageProgress: mean(scores),
		};
	});

	const activities = snapshot.dimensions.flatMap((dimension) =>
		snapshot.activities
			.filter((activity) => activity.dimension === dimension)
			.map((activity) => {
				const claim = claims.get(activity.uuid);
				const status: DsommHeatmapStatus = !claim
					? "not-assessed"
					: claim.applicability === "not-applicable"
						? "not-applicable"
						: claim.progress ?? "not-assessed";
				return {
					uuid: activity.uuid,
					dimension,
					status,
				};
			}),
	);

	const applicableScores = validated.claims.flatMap((claim) =>
		claim.applicability === "applicable" && claim.score !== null
			? [claim.score]
			: [],
	);
	return {
		activities,
		dimensions,
		modelActivities: snapshot.activities.length,
		assessed: validated.claims.length,
		applicable: applicableScores.length,
		notApplicable: validated.claims.length - applicableScores.length,
		notAssessed: snapshot.activities.length - validated.claims.length,
		coverage: validated.claims.length / snapshot.activities.length,
		averageProgress: mean(applicableScores),
	};
}
