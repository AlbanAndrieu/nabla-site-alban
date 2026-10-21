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
	return new Map(health.services.map((e) => [e.entityRef, e.state]));
}
