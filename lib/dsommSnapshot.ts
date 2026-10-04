import snapshot from "@/data/security/dsomm/model.snapshot.json";

export type DsommDifficulty = {
	knowledge: number;
	time: number;
	resources: number;
};

export type DsommActivity = {
	dimension: string;
	subdimension: string;
	name: string;
	uuid: string;
	level: number;
	usefulness: number | null;
	description: string;
	risk: string;
	measure: string;
	assessment: string;
	difficultyOfImplementation: DsommDifficulty;
	tags: string[];
	references: Record<string, string[]>;
};

export type DsommSnapshot = {
	source: {
		project: string;
		repository: string;
		sourcePath: string;
		sourceCommit: string;
		version: string;
		released: string;
		snapshotDate: string;
		upstreamUrl: string;
		projectUrl: string;
		license: string;
		licenseUrl: string;
	};
	dimensions: string[];
	activities: DsommActivity[];
};

export type DsommDimensionCoverage = {
	dimension: string;
	activityCount: number;
};

export type DsommSnapshotStats = {
	activityCount: number;
	dimensionCount: number;
	levels: Array<{ level: number; count: number }>;
	dimensions: DsommDimensionCoverage[];
	maxDimensionActivityCount: number;
};

const ACTIVITY_ID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?:-(?:medium|advanced))?$/i;
const SHA_PATTERN = /^[0-9a-f]{40}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
const DSOMM_SOURCE = {
	project: "OWASP DevSecOps Maturity Model (DSOMM)",
	repository: "devsecopsmaturitymodel/DevSecOps-MaturityModel-data",
	sourcePath: "generated/model.yaml",
	projectUrl: "https://dsomm.owasp.org/",
	license: "GPL-3.0",
} as const;

function invalid(message: string): never {
	throw new Error(`Invalid DSOMM snapshot: ${message}`);
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		invalid(`${label} must be an object`);
	}
	return value as Record<string, unknown>;
}

function requireString(value: unknown, label: string): string {
	if (typeof value !== "string" || value.length === 0) {
		invalid(`${label} must be a non-empty string`);
	}
	return value;
}

function requireStringArray(value: unknown, label: string): string[] {
	if (
		!Array.isArray(value) ||
		value.some((item) => typeof item !== "string" || item.length === 0)
	) {
		invalid(`${label} must be a non-empty-string array`);
	}
	return value as string[];
}

function requireIsoDate(value: unknown, label: string): string {
	const date = requireString(value, label);
	if (!DATE_PATTERN.test(date)) {
		invalid(`${label} must use YYYY-MM-DD`);
	}
	const parsed = new Date(`${date}T00:00:00Z`);
	if (
		Number.isNaN(parsed.getTime()) ||
		parsed.toISOString().slice(0, 10) !== date
	) {
		invalid(`${label} must be a real calendar date`);
	}
	return date;
}

function requireScore(value: unknown, label: string): number {
	if (
		typeof value !== "number" ||
		!Number.isInteger(value) ||
		value < 1 ||
		value > 5
	) {
		invalid(`${label} must be an integer from 1 to 5`);
	}
	return value;
}

export function validateDsommSnapshot(value: unknown): DsommSnapshot {
	const root = requireRecord(value, "root");
	const source = requireRecord(root.source, "source");
	for (const key of [
		"project",
		"repository",
		"sourcePath",
		"version",
		"released",
		"snapshotDate",
		"upstreamUrl",
		"projectUrl",
		"license",
		"licenseUrl",
	] as const) {
		requireString(source[key], `source.${key}`);
	}
	const sourceCommit = requireString(
		source.sourceCommit,
		"source.sourceCommit",
	);
	if (!SHA_PATTERN.test(sourceCommit)) {
		invalid("source.sourceCommit must be a full Git SHA");
	}
	const version = requireString(source.version, "source.version");
	if (!VERSION_PATTERN.test(version)) {
		invalid("source.version must be semantic x.y.z");
	}
	const released = requireIsoDate(source.released, "source.released");
	const snapshotDate = requireIsoDate(
		source.snapshotDate,
		"source.snapshotDate",
	);
	if (snapshotDate < released) {
		invalid("source.snapshotDate must not predate source.released");
	}
	for (const [key, expected] of Object.entries(DSOMM_SOURCE)) {
		if (source[key] !== expected) {
			invalid(`source.${key} must match canonical OWASP DSOMM provenance`);
		}
	}
	const expectedUpstreamUrl = `https://github.com/${DSOMM_SOURCE.repository}/blob/${sourceCommit}/${DSOMM_SOURCE.sourcePath}`;
	const expectedLicenseUrl = `https://github.com/${DSOMM_SOURCE.repository}/blob/${sourceCommit}/LICENSE`;
	if (source.upstreamUrl !== expectedUpstreamUrl) {
		invalid("source.upstreamUrl must be pinned to source.sourceCommit");
	}
	if (source.licenseUrl !== expectedLicenseUrl) {
		invalid("source.licenseUrl must be pinned to source.sourceCommit");
	}

	const dimensions = requireStringArray(root.dimensions, "dimensions");
	if (dimensions.length === 0) invalid("dimensions must not be empty");
	if (new Set(dimensions).size !== dimensions.length) {
		invalid("dimensions must be unique");
	}
	const dimensionSet = new Set(dimensions);

	if (!Array.isArray(root.activities) || root.activities.length === 0) {
		invalid("activities must be a non-empty array");
	}

	const activityIds = new Set<string>();
	const usedDimensions = new Set<string>();
	for (const [index, rawActivity] of root.activities.entries()) {
		const activity = requireRecord(rawActivity, `activities[${index}]`);
		const dimension = requireString(
			activity.dimension,
			`activities[${index}].dimension`,
		);
		if (!dimensionSet.has(dimension)) {
			invalid(`activities[${index}].dimension must exist in dimensions`);
		}
		usedDimensions.add(dimension);

		for (const key of [
			"subdimension",
			"name",
			"description",
			"risk",
			"measure",
			"assessment",
		] as const) {
			if (typeof activity[key] !== "string") {
				invalid(`activities[${index}].${key} must be a string`);
			}
		}

		const activityId = requireString(
			activity.uuid,
			`activities[${index}].uuid`,
		);
		if (!ACTIVITY_ID_PATTERN.test(activityId)) {
			invalid(
				`activities[${index}].uuid must be a supported upstream activity ID`,
			);
		}
		if (activityIds.has(activityId)) {
			invalid(`duplicate activity UUID ${activityId}`);
		}
		activityIds.add(activityId);

		requireScore(activity.level, `activities[${index}].level`);
		if (activity.usefulness !== null) {
			requireScore(activity.usefulness, `activities[${index}].usefulness`);
		}

		const difficulty = requireRecord(
			activity.difficultyOfImplementation,
			`activities[${index}].difficultyOfImplementation`,
		);
		for (const key of ["knowledge", "time", "resources"] as const) {
			requireScore(
				difficulty[key],
				`activities[${index}].difficultyOfImplementation.${key}`,
			);
		}

		requireStringArray(activity.tags, `activities[${index}].tags`);
		const references = requireRecord(
			activity.references,
			`activities[${index}].references`,
		);
		for (const [framework, values] of Object.entries(references)) {
			requireStringArray(
				values,
				`activities[${index}].references.${framework}`,
			);
		}
	}

	for (const dimension of dimensions) {
		if (!usedDimensions.has(dimension)) {
			invalid(`dimension ${dimension} must contain at least one activity`);
		}
	}

	return value as DsommSnapshot;
}

export const DSOMM_SNAPSHOT = validateDsommSnapshot(snapshot);

export function dsommSnapshotStats(
	value: DsommSnapshot = DSOMM_SNAPSHOT,
): DsommSnapshotStats {
	const levelCounts = new Map<number, number>();
	const dimensionCounts = new Map<string, number>(
		value.dimensions.map((dimension) => [dimension, 0]),
	);
	for (const activity of value.activities) {
		levelCounts.set(activity.level, (levelCounts.get(activity.level) ?? 0) + 1);
		dimensionCounts.set(
			activity.dimension,
			(dimensionCounts.get(activity.dimension) ?? 0) + 1,
		);
	}
	const dimensions = value.dimensions.map((dimension) => ({
		dimension,
		activityCount: dimensionCounts.get(dimension) ?? 0,
	}));
	return {
		activityCount: value.activities.length,
		dimensionCount: value.dimensions.length,
		levels: [...levelCounts.entries()]
			.sort(([left], [right]) => left - right)
			.map(([level, count]) => ({ level, count })),
		dimensions,
		maxDimensionActivityCount: Math.max(
			...dimensions.map(({ activityCount }) => activityCount),
		),
	};
}
