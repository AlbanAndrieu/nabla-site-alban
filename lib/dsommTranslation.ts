import translation from "@/data/security/dsomm/model.fr.json";
import {
	DSOMM_SNAPSHOT,
	type DsommActivity,
	type DsommSnapshot,
} from "@/lib/dsommSnapshot";

export type DsommActivityTranslation = Pick<
	DsommActivity,
	"name" | "description" | "risk" | "measure" | "assessment"
>;

type DsommFrenchCatalog = {
	sourceCommit: string;
	sourceVersion: string;
	dimensions: Record<string, string>;
	subdimensions: Record<string, string>;
	activities: Record<string, DsommActivityTranslation>;
};

export type LocalizedDsommSnapshot = DsommSnapshot & {
	dimensionLabels: Readonly<Record<string, string>>;
};

function fail(message: string): never {
	throw new Error(`Invalid DSOMM French translation: ${message}`);
}

export function validateDsommFrenchCatalog(
	value: DsommFrenchCatalog,
	snapshot: DsommSnapshot = DSOMM_SNAPSHOT,
): DsommFrenchCatalog {
	if (value.sourceCommit !== snapshot.source.sourceCommit) {
		fail("sourceCommit must match the pinned upstream snapshot");
	}
	if (value.sourceVersion !== snapshot.source.version) {
		fail("sourceVersion must match the pinned upstream snapshot");
	}
	for (const dimension of snapshot.dimensions) {
		if (!value.dimensions[dimension])
			fail(`missing dimension translation: ${dimension}`);
	}
	for (const subdimension of new Set(
		snapshot.activities.map((activity) => activity.subdimension),
	)) {
		if (!value.subdimensions[subdimension])
			fail(`missing subdimension translation: ${subdimension}`);
	}
	const upstreamIds = new Set(
		snapshot.activities.map((activity) => activity.uuid),
	);
	const translatedIds = Object.keys(value.activities);
	if (translatedIds.length !== upstreamIds.size) {
		fail(
			`expected ${upstreamIds.size} activity translations, got ${translatedIds.length}`,
		);
	}
	for (const activity of snapshot.activities) {
		const localized = value.activities[activity.uuid];
		if (!localized) fail(`missing activity translation: ${activity.uuid}`);
		for (const field of [
			"name",
			"description",
			"risk",
			"measure",
			"assessment",
		] as const) {
			if (typeof localized[field] !== "string")
				fail(`${activity.uuid}.${field} must be a string`);
			if (activity[field] && !localized[field])
				fail(`${activity.uuid}.${field} must not be empty`);
		}
	}
	for (const uuid of translatedIds) {
		if (!upstreamIds.has(uuid)) fail(`unknown activity translation: ${uuid}`);
	}
	return value;
}

export function localizeDsommSnapshot(
	locale: "en" | "fr",
	snapshot: DsommSnapshot = DSOMM_SNAPSHOT,
): LocalizedDsommSnapshot {
	if (locale === "en") {
		return {
			...snapshot,
			dimensionLabels: Object.fromEntries(
				snapshot.dimensions.map((dimension) => [dimension, dimension]),
			),
		};
	}
	const catalog = validateDsommFrenchCatalog(
		translation as DsommFrenchCatalog,
		snapshot,
	);
	return {
		...snapshot,
		dimensions: snapshot.dimensions.map(
			(dimension) => catalog.dimensions[dimension],
		),
		dimensionLabels: catalog.dimensions,
		activities: snapshot.activities.map((activity) => ({
			...activity,
			dimension: catalog.dimensions[activity.dimension],
			subdimension: catalog.subdimensions[activity.subdimension],
			...catalog.activities[activity.uuid],
		})),
	};
}
