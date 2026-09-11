import {
	isRecord,
	nullableBoolean,
	optionalNumber,
	optionalString,
} from "./homelabObservabilityParsing";
import type {
	PlatformMetricKey,
	PlatformMetricsEvidence,
} from "./homelabObservabilityTypes";

const PLATFORM_METRIC_KEYS = [
	"truenas_memory_available_ratio",
	"truenas_cpu_busy_ratio",
	"truenas_node_up",
	"truenas_cadvisor_up",
	"pfsense_metrics_up",
	"prometheus_up",
] as const satisfies readonly PlatformMetricKey[];

function metricState(value: unknown): PlatformMetricsEvidence["state"] {
	return value === "healthy" ||
		value === "degraded" ||
		value === "not_configured" ||
		value === "telemetry_unavailable"
		? value
		: "unknown";
}

export function parsePlatformMetrics(
	value: unknown,
): PlatformMetricsEvidence | null {
	if (!isRecord(value)) return null;
	const rawMetrics = isRecord(value.metrics) ? value.metrics : {};
	const metrics: PlatformMetricsEvidence["metrics"] = {};
	for (const key of PLATFORM_METRIC_KEYS) {
		const raw = rawMetrics[key];
		if (!isRecord(raw)) continue;
		const metric = optionalString(raw.metric);
		const metricValue =
			raw.value === null
				? null
				: typeof raw.value === "number" && Number.isFinite(raw.value)
					? raw.value
					: undefined;
		if (!metric || metricValue === undefined) continue;
		metrics[key] = { metric, value: metricValue };
	}

	const rawSummary = isRecord(value.summary) ? value.summary : {};
	return {
		...(optionalNumber(value.schema_version) !== undefined
			? { schemaVersion: optionalNumber(value.schema_version) }
			: {}),
		...(optionalString(value.generated_at)
			? { generatedAt: optionalString(value.generated_at) }
			: {}),
		state: metricState(value.state),
		configured: nullableBoolean(value.configured),
		...(optionalString(value.source)
			? { source: optionalString(value.source) }
			: {}),
		...(optionalString(value.error_kind)
			? { errorKind: optionalString(value.error_kind) }
			: {}),
		...(optionalString(value.exception_type)
			? { exceptionType: optionalString(value.exception_type) }
			: {}),
		metrics,
		summary: {
			signalsAvailable: optionalNumber(rawSummary.signals_available) ?? 0,
			signalsTotal:
				optionalNumber(rawSummary.signals_total) ?? PLATFORM_METRIC_KEYS.length,
			telemetryUp: optionalNumber(rawSummary.telemetry_up) ?? 0,
			telemetryTotal: optionalNumber(rawSummary.telemetry_total) ?? 4,
			...(typeof rawSummary.truenas_memory_available_ratio === "number" &&
			Number.isFinite(rawSummary.truenas_memory_available_ratio)
				? {
						truenasMemoryAvailableRatio:
							rawSummary.truenas_memory_available_ratio,
					}
				: {}),
			...(typeof rawSummary.truenas_cpu_busy_ratio === "number" &&
			Number.isFinite(rawSummary.truenas_cpu_busy_ratio)
				? { truenasCpuBusyRatio: rawSummary.truenas_cpu_busy_ratio }
				: {}),
			...(typeof rawSummary.pfsense_metrics_up === "number" &&
			Number.isFinite(rawSummary.pfsense_metrics_up)
				? { pfsenseMetricsUp: rawSummary.pfsense_metrics_up }
				: {}),
		},
	};
}
