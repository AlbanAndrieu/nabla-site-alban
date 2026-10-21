/** Strict, non-operational SERVICE health contract. Never deserialize raw probes. */
import type { HomelabHealthState } from "./homelabHealthTypes";

export type SiteHealthV2 = {
	schemaVersion: 2;
	model: "backstage-health";
	catalogRevision: string;
	boardState: "fresh" | "stale" | "pending";
	services: { entityRef: string; state: HomelabHealthState }[];
};

const REVISION = /^sha256:[0-9a-f]{64}$/;
// Canonical Backstage names and namespaces may contain dots or underscores.
// Bound segment lengths and reject paths and whitespace.
const REF = /^(component|resource|api):[a-z0-9][a-z0-9._-]{0,62}\/[a-z0-9][a-z0-9._-]{0,62}$/;
const STATES = new Set(["ok", "warn", "fail", "unknown"]);

export function parseSiteHealthV2(value: unknown): SiteHealthV2 | null {
	if (!value || typeof value !== "object" || Array.isArray(value)) return null;
	const raw = value as Record<string, unknown>;
	if (
		raw.schemaVersion !== 2 ||
		raw.model !== "backstage-health" ||
		typeof raw.catalogRevision !== "string" ||
		!REVISION.test(raw.catalogRevision) ||
		(typeof raw.boardState !== "string" ||
			!["fresh", "stale", "pending"].includes(raw.boardState)) ||
		!Array.isArray(raw.services) ||
		raw.services.length > 2000
	)
		return null;

	const seen = new Set<string>();
	const services: SiteHealthV2["services"] = [];
	for (const item of raw.services) {
		if (!item || typeof item !== "object" || Array.isArray(item)) return null;
		const entry = item as Record<string, unknown>;
		if (
			typeof entry.entityRef !== "string" ||
			!REF.test(entry.entityRef) ||
			seen.has(entry.entityRef) ||
			typeof entry.state !== "string" ||
			!STATES.has(entry.state)
		)
			return null;
		seen.add(entry.entityRef);
		services.push({
			entityRef: entry.entityRef,
			state:
				raw.boardState === "fresh"
					? (entry.state as HomelabHealthState)
					: "unknown",
		});
	}
	return {
		schemaVersion: 2,
		model: "backstage-health",
		catalogRevision: raw.catalogRevision,
		boardState: raw.boardState as SiteHealthV2["boardState"],
		services,
	};
}

export function siteHealthIndex(
	health: SiteHealthV2 | null | undefined,
	catalogRevision: unknown,
): Map<string, HomelabHealthState> {
	if (
		!health ||
		health.boardState !== "fresh" ||
		health.catalogRevision !== catalogRevision
	)
		return new Map();
	// FastAPI currently reconciles probe rows by metadata.name, not entityRef.
	// Distinct Backstage entities with the same name could inherit each other's
	// health. Until the producer joins by entityRef, fail closed for all of them.
	const nameCounts = new Map<string, number>();
	for (const entry of health.services) {
		const name = entry.entityRef.slice(entry.entityRef.lastIndexOf("/") + 1);
		nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
	}
	return new Map(
		health.services.map((entry) => {
			const name = entry.entityRef.slice(entry.entityRef.lastIndexOf("/") + 1);
			return [
				entry.entityRef,
				(nameCounts.get(name) ?? 0) > 1 ? "unknown" : entry.state,
			] as const;
		}),
	);
}
