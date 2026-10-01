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

export type DsommSnapshotStats = {
	activityCount: number;
	dimensionCount: number;
	levels: Array<{ level: number; count: number }>;
};

export const DSOMM_SNAPSHOT = snapshot as DsommSnapshot;

export function dsommSnapshotStats(
	value: DsommSnapshot = DSOMM_SNAPSHOT,
): DsommSnapshotStats {
	const levelCounts = new Map<number, number>();
	for (const activity of value.activities) {
		levelCounts.set(activity.level, (levelCounts.get(activity.level) ?? 0) + 1);
	}
	return {
		activityCount: value.activities.length,
		dimensionCount: value.dimensions.length,
		levels: [...levelCounts.entries()]
			.sort(([left], [right]) => left - right)
			.map(([level, count]) => ({ level, count })),
	};
}
