import type { HomelabHealthSnapshot } from "./homelabHealth";
import {
	readTrueNasApiOperatorEvidence,
	readTrueNasTransportEvidence,
	type TrueNasApiOperatorEvidence,
	type TrueNasTransportEvidence,
} from "./homelabTrueNasDiagnostics";

type UnknownRecord = Record<string, unknown>;

export type ProbeRuntimeEvidence = {
	startedAt?: string;
	uptimeSeconds?: number;
	state?: string;
	eligibleProbeSlots?: number;
	knownProbeSlots?: number;
	coveragePercent?: number;
	estimatedFullCycleSeconds?: number | null;
};

export type AggregatePerformanceEvidence = {
	phasesMs: Record<string, number>;
	fixedCardinality?: boolean;
	phaseCount?: number;
};

export type HomelabOperatorDiagnostics = {
	probeRuntime?: ProbeRuntimeEvidence;
	performance?: AggregatePerformanceEvidence;
	evidencePriority: string[];
	trueNasApi?: TrueNasApiOperatorEvidence;
	trueNasTransport?: TrueNasTransportEvidence;
	trueNasRuntimeError?: string;
};

function isRecord(value: unknown): value is UnknownRecord {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | undefined {
	return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function number(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) && value >= 0
		? value
		: undefined;
}

function strings(value: unknown): string[] {
	return Array.isArray(value)
		? value.filter(
				(item): item is string => typeof item === "string" && Boolean(item.trim()),
			)
		: [];
}

function readProbeRuntime(raw: UnknownRecord): ProbeRuntimeEvidence | undefined {
	if (!isRecord(raw.probe_runtime)) return undefined;
	const value = raw.probe_runtime;
	return {
		...(text(value.started_at) ? { startedAt: text(value.started_at) } : {}),
		...(number(value.uptime_seconds) !== undefined
			? { uptimeSeconds: number(value.uptime_seconds) }
			: {}),
		...(text(value.state) ? { state: text(value.state) } : {}),
		...(number(value.eligible_probe_slots) !== undefined
			? { eligibleProbeSlots: number(value.eligible_probe_slots) }
			: {}),
		...(number(value.known_probe_slots) !== undefined
			? { knownProbeSlots: number(value.known_probe_slots) }
			: {}),
		...(number(value.coverage_percent) !== undefined
			? { coveragePercent: number(value.coverage_percent) }
			: {}),
		...(value.estimated_full_cycle_seconds === null
			? { estimatedFullCycleSeconds: null }
			: number(value.estimated_full_cycle_seconds) !== undefined
				? { estimatedFullCycleSeconds: number(value.estimated_full_cycle_seconds) }
				: {}),
	};
}

function readPerformance(
	raw: UnknownRecord,
): AggregatePerformanceEvidence | undefined {
	if (!isRecord(raw.performance) || !isRecord(raw.performance.phases_ms))
		return undefined;
	const phasesMs = Object.fromEntries(
		Object.entries(raw.performance.phases_ms).flatMap(([key, value]) =>
			number(value) !== undefined ? [[key, number(value) as number]] : [],
		),
	);
	return {
		phasesMs,
		...(typeof raw.performance.fixed_cardinality === "boolean"
			? { fixedCardinality: raw.performance.fixed_cardinality }
			: {}),
		...(number(raw.performance.phase_count) !== undefined
			? { phaseCount: number(raw.performance.phase_count) }
			: {}),
	};
}

export function readHomelabOperatorDiagnostics(
	snapshot: HomelabHealthSnapshot | null,
): HomelabOperatorDiagnostics {
	if (!snapshot) return { evidencePriority: [] };
	const raw = snapshot as unknown as UnknownRecord;
	const reconciliation = isRecord(raw.reconciliation) ? raw.reconciliation : {};
	const trueNas = isRecord(raw.truenas) ? raw.truenas : {};
	const probeRuntime = readProbeRuntime(raw);
	const performance = readPerformance(raw);
	const trueNasApi = readTrueNasApiOperatorEvidence(trueNas.api);
	const trueNasTransport = readTrueNasTransportEvidence(trueNas.diagnostics);
	return {
		...(probeRuntime ? { probeRuntime } : {}),
		...(performance ? { performance } : {}),
		evidencePriority: strings(reconciliation.evidence_priority),
		...(trueNasApi ? { trueNasApi } : {}),
		...(trueNasTransport ? { trueNasTransport } : {}),
		...(text(raw.truenas_runtime_error)
			? { trueNasRuntimeError: text(raw.truenas_runtime_error) }
			: {}),
	};
}
