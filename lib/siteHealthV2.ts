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
const REF = /^(component|resource|api):[a-z0-9-]+\/[a-z0-9-]+$/;
const STATES = new Set(["ok", "warn", "fail", "unknown"]);

export function parseSiteHealthV2(value: unknown): SiteHealthV2 | null {
	if (!value || typeof value !== "object" || Array.isArray(value)) return null;
	const raw = value as Record<string, unknown>;
	if (
		raw.schemaVersion !== 2 ||
		raw.model !== "backstage-health" ||
		typeof raw.catalogRevision !== "string" ||
		!REVISION.test(raw.catalogRevision) ||
		!["fresh", "stale", "pending"].includes(String(raw.boardState)) ||
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
			!STATES.has(String(entry.state))
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
