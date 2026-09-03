"use client";

import { useTranslations } from "next-intl";
import type { HomelabHealthSnapshot } from "@/lib/homelabHealth";
import { homelabHealthColor } from "@/lib/homelabHealthPresentation";
import styles from "./HomelabServicesBlock.module.css";

const RUNTIME_ICON_CLASS = {
	ok: "fas fa-circle-check",
	warn: "fas fa-triangle-exclamation",
	fail: "fas fa-circle-xmark",
	missing: "fas fa-skull-crossbones",
} as const;

type Props = {
	snapshot: HomelabHealthSnapshot | null;
	healthUnavailable: boolean;
	healthHttpStatus: number | null;
	healthRefreshing: boolean;
	onOpenCriticality: () => void;
};

export default function HomelabStatusOverview({
	snapshot,
	healthUnavailable,
	healthHttpStatus,
	healthRefreshing,
	onOpenCriticality,
}: Readonly<Props>) {
	const t = useTranslations("homelab");
	const truenasPublic = snapshot?.truenas?.public;
	const truenasInternal = snapshot?.truenas?.internal;
	const truenasApi = snapshot?.truenas?.api;
	const truenasPublicUp =
		truenasPublic?.reachable === true && truenasPublic.state !== "fail";
	const truenasDown = !truenasPublicUp && snapshot?.truenas?.state === "fail";
	const truenasWarning = !truenasPublicUp && snapshot?.truenas?.state === "warn";
	const truenasRuntimeStale = snapshot?.truenas_runtime_stale === true;
	const refreshInProgress = healthRefreshing && (healthUnavailable || snapshot === null);
	const runtimeWarningDetails: string[] = [];

	if (healthUnavailable) {
		runtimeWarningDetails.push(
			t("truenas.liveSnapshotUnavailable", {
				status:
					healthHttpStatus === null
						? t("truenas.networkError")
						: `HTTP ${healthHttpStatus}`,
			}),
		);
	}
	if (truenasApi?.reachable === false) {
		runtimeWarningDetails.push(
			t("truenas.apiUnavailable", {
				error: truenasApi.error?.trim() || t("truenas.noErrorDetail"),
			}),
		);
	}
	if (snapshot?.truenas_runtime_reachable === false) {
		runtimeWarningDetails.push(t("truenas.runtimeUnavailable"));
	}
	if (truenasRuntimeStale) runtimeWarningDetails.push(t("truenas.runtimeStale"));

	const runtimeObservationIncomplete =
		!refreshInProgress &&
		(healthUnavailable ||
			truenasApi?.reachable === false ||
			snapshot?.truenas_runtime_reachable === false ||
			truenasRuntimeStale);

	return (
		<>
			{(truenasDown || truenasWarning) && (
				<div className={`alert ${truenasDown ? "alert-danger" : "alert-warning"}`} role="alert" data-truenas-connectivity-warning>
					<strong><i className="fas fa-triangle-exclamation" aria-hidden="true" /> {truenasDown ? t("truenas.down") : t("truenas.degraded")}</strong>
					{" — "}
					{t("truenas.publicProbe", { state: truenasPublic?.state ?? "unknown" })}
					{truenasInternal
						? `; ${t("truenas.internalProbe", { host: truenasInternal.host, port: truenasInternal.port, state: truenasInternal.state })}`
						: `; ${t("truenas.internalUnavailable")}`}
					. {t("truenas.dependencyNote")}
				</div>
			)}

			{refreshInProgress && (
				<div className="alert alert-info" role="status" data-homelab-health-refreshing>
					<i className="fas fa-rotate fa-spin" aria-hidden="true" /> <strong>{t("truenas.refreshing")}</strong> — {t("truenas.refreshingNote")}
				</div>
			)}

			{runtimeObservationIncomplete && (
				<div className="alert alert-warning" role="status" data-truenas-runtime-warning>
					<strong><i className="fas fa-triangle-exclamation" aria-hidden="true" /> {t("truenas.runtimeDataUnavailable")}</strong>
					{" — "}{runtimeWarningDetails.join(" ")} {t("truenas.runtimeDependencyNote")}
				</div>
			)}

			<div className={styles.statusLegend}>
				<div className={styles.legendGroup} role="note" aria-label={t("runtime.legendTitle")} data-truenas-runtime-legend>
					<strong>{t("runtime.legendTitle")}:</strong>
					<span><i className={RUNTIME_ICON_CLASS.ok} style={{ color: homelabHealthColor("ok") }} aria-hidden="true" /> {t("runtime.legendRunning")}</span>
					<span><i className={RUNTIME_ICON_CLASS.warn} style={{ color: homelabHealthColor("warn") }} aria-hidden="true" /> {t("runtime.legendDegraded")}</span>
					<span><i className={RUNTIME_ICON_CLASS.fail} style={{ color: homelabHealthColor("fail") }} aria-hidden="true" /> {t("runtime.legendFailed")}</span>
					<span><i className={RUNTIME_ICON_CLASS.missing} style={{ color: homelabHealthColor("unknown") }} aria-hidden="true" /> {t("runtime.legendMissing")}</span>
				</div>
				<div className={styles.legendGroup} role="note" aria-label={t("dependency.legendTitle")} data-dependency-health-legend>
					<span><strong>{t("dependency.legendTitle")}:</strong> {t("dependency.legend")}</span>
					<a className={styles.legendLink} href="#critical-dependency-hierarchy" onClick={(event) => { event.preventDefault(); onOpenCriticality(); }}>
						{t("dependency.inspectHierarchy")}
					</a>
				</div>
			</div>
		</>
	);
}
