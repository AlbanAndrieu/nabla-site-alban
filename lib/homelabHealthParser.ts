import type {
	HomelabHealthSnapshot,
	HomelabInternalHealthEntry,
} from "./homelabHealthTypes";
import { parsePfSenseDnsPosture } from "./homelabHealthPfSenseParsing";
import {
	parseHealthBoardMetadata,
	parseProbeCache,
	parseProbeSummary,
	parseReconciliationMetadata,
} from "./homelabHealthProbeParsing";
import {
	enrichRollingProbeSnapshot,
	normalizeRollingProbePayload,
} from "./homelabHealthRollingProbe";
import {
	isRecord,
	validHealthEntry,
	validInternalHealthEntry,
	validOptionalBoolean,
	validOptionalNumber,
	validTrueNasHealth,
} from "./homelabHealthValidation";

export function parseHomelabHealthSnapshot(
	value: unknown,
): HomelabHealthSnapshot | null {
	const normalized = normalizeRollingProbePayload(value);
	if (!isRecord(normalized) || !Array.isArray(normalized.services)) {
		return null;
	}
	if (
		typeof normalized.schema_version !== "number" ||
		!Number.isFinite(normalized.schema_version) ||
		typeof normalized.checked_at !== "string" ||
		normalized.checked_at.trim().length === 0
	) {
		return null;
	}

	const services = normalized.services.filter(validHealthEntry);
	if (
		normalized.truenas !== undefined &&
		normalized.truenas !== null &&
		!validTrueNasHealth(normalized.truenas)
	) {
		return null;
	}
	if (!validOptionalBoolean(normalized.internal_probes_enabled)) return null;

	let internalServices: HomelabInternalHealthEntry[] | undefined;
	if (normalized.internal_services !== undefined) {
		if (!Array.isArray(normalized.internal_services)) return null;
		internalServices = normalized.internal_services.filter(
			validInternalHealthEntry,
		);
	}

	const probeSummary = parseProbeSummary(normalized.probe_summary);
	const probeCache = parseProbeCache(normalized.probe_cache);
	const healthBoard = parseHealthBoardMetadata(normalized.health_board);
	const reconciliation = parseReconciliationMetadata(normalized.reconciliation);
	if (!validOptionalBoolean(normalized.truenas_runtime_reachable)) return null;
	if (!validOptionalBoolean(normalized.truenas_runtime_stale)) return null;
	if (!validOptionalBoolean(normalized.cloudflare_configured)) return null;
	if (!validOptionalNumber(normalized.cloudflare_tunnels_observed)) return null;
	if (!validOptionalNumber(normalized.refresh_elapsed_ms)) return null;

	let pfsense: HomelabHealthSnapshot["pfsense"] | undefined;
	if (isRecord(normalized.pfsense)) {
		const dns = parsePfSenseDnsPosture(normalized.pfsense.dns);
		if (dns) pfsense = { dns };
	}

	const sanitizedValue = { ...normalized };
	delete sanitizedValue.pfsense;
	delete sanitizedValue.probe_summary;
	delete sanitizedValue.probe_cache;
	delete sanitizedValue.health_board;
	delete sanitizedValue.reconciliation;

	const snapshot = {
		...sanitizedValue,
		services,
		...(internalServices === undefined
			? {}
			: { internal_services: internalServices }),
		...(probeSummary ? { probe_summary: probeSummary } : {}),
		...(probeCache ? { probe_cache: probeCache } : {}),
		...(healthBoard ? { health_board: healthBoard } : {}),
		...(reconciliation ? { reconciliation } : {}),
		...(pfsense ? { pfsense } : {}),
	} as HomelabHealthSnapshot;

	return enrichRollingProbeSnapshot(snapshot, value);
}
