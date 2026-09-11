"use client";

import { useTranslations } from "next-intl";
import type {
	HomelabObservabilitySnapshot,
	PlatformMetricKey,
} from "@/lib/homelabObservability";
import styles from "./HomelabOperationalEvidence.module.css";

const PLATFORM_METRIC_LABEL_KEY: Record<PlatformMetricKey, string> = {
	truenas_memory_available_ratio: "metrics.truenasMemoryAvailable",
	truenas_cpu_busy_ratio: "metrics.truenasCpuBusy",
	truenas_node_up: "metrics.truenasNodeExporter",
	truenas_cadvisor_up: "metrics.truenasCadvisor",
	pfsense_metrics_up: "metrics.pfsenseExporter",
	prometheus_up: "metrics.prometheus",
};

const PLATFORM_METRIC_STATE_KEY: Record<
	NonNullable<HomelabObservabilitySnapshot["platformMetrics"]>["state"],
	string
> = {
	healthy: "metrics.states.healthy",
	degraded: "metrics.states.degraded",
	not_configured: "metrics.states.not_configured",
	telemetry_unavailable: "metrics.states.telemetry_unavailable",
	unknown: "metrics.states.unknown",
};

function metricValue(
	key: PlatformMetricKey,
	value: number | null,
	t: ReturnType<typeof useTranslations>,
): string {
	if (value === null) return t("metrics.unavailable");
	if (
		key === "truenas_memory_available_ratio" ||
		key === "truenas_cpu_busy_ratio"
	) {
		return t("metrics.percent", { value: (value * 100).toFixed(1) });
	}
	return value >= 1 ? t("metrics.up") : t("metrics.down");
}

export default function HomelabOperationalMetrics({
	evidence,
}: Readonly<{ evidence: HomelabObservabilitySnapshot }>) {
	const t = useTranslations("operations");
	const metrics = evidence.platformMetrics;
	if (!metrics) return null;

	return (
		<details className={styles.details} data-platform-metrics>
			<summary>
				{t("metrics.title")} · {t(PLATFORM_METRIC_STATE_KEY[metrics.state])}
			</summary>
			<div className={styles.detailsBody}>
				<p>{t("metrics.lead")}</p>
				<div className={styles.sourceRow}>
					<span>{t("metrics.source", { source: metrics.source ?? "prometheus" })}</span>
					{metrics.generatedAt ? (
						<span>{t("metrics.generatedAt", { timestamp: metrics.generatedAt })}</span>
					) : null}
					<span>
						{t("metrics.signals", {
							available: metrics.summary.signalsAvailable,
							total: metrics.summary.signalsTotal,
						})}
					</span>
					<span>
						{t("metrics.telemetry", {
							up: metrics.summary.telemetryUp,
							total: metrics.summary.telemetryTotal,
						})}
					</span>
				</div>
				{metrics.errorKind || metrics.exceptionType ? (
					<div className={styles.alertWarn} role="status">
						<strong>{t("metrics.telemetryUnavailable")}</strong>
						<small>
							{[metrics.errorKind, metrics.exceptionType].filter(Boolean).join(" · ")}
						</small>
					</div>
				) : null}
				<ul className={styles.evidenceList}>
					{(
						[
							"truenas_memory_available_ratio",
							"truenas_cpu_busy_ratio",
							"truenas_node_up",
							"truenas_cadvisor_up",
							"pfsense_metrics_up",
							"prometheus_up",
						] as const
					).map((key) => {
						const sample = metrics.metrics[key];
						return (
							<li key={key} data-platform-metric={key}>
								<div className={styles.evidenceHeading}>
									<strong>{t(PLATFORM_METRIC_LABEL_KEY[key])}</strong>
									<span className={styles.badge}>
										{metricValue(key, sample?.value ?? null, t)}
									</span>
								</div>
								{sample?.metric ? <small>{sample.metric}</small> : null}
							</li>
						);
					})}
				</ul>
				<small className={styles.detailText}>{t("metrics.healthSeparation")}</small>
			</div>
		</details>
	);
}
