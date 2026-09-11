"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { HomelabExposureEvidence } from "@/lib/homelabDiagnostics";
import type {
	HomelabObservabilitySnapshot,
	ProbeCacheEvidence,
} from "@/lib/homelabObservability";
import type {
	ExposurePortEvidence,
	OperationalHealthState,
} from "@/lib/homelabOperationalEvidence";
import styles from "./HomelabOperationalEvidence.module.css";

const STATE_ICON: Record<OperationalHealthState, string> = {
	ok: "fas fa-circle-check",
	warn: "fas fa-triangle-exclamation",
	fail: "fas fa-circle-xmark",
	unknown: "fas fa-circle-question",
};

const EXPOSURE_PRIORITY: Record<HomelabExposureEvidence["state"], number> = {
	mismatch: 0,
	incomplete: 1,
	match: 2,
	not_applicable: 3,
};

function stateClass(state: OperationalHealthState): string {
	return state === "ok"
		? styles.stateOk
		: state === "warn"
			? styles.stateWarn
			: state === "fail"
				? styles.stateFail
				: styles.stateUnknown;
}

function exposureStateClass(state: HomelabExposureEvidence["state"]): string {
	if (state === "match") return styles.stateOk;
	if (state === "mismatch") return styles.stateFail;
	if (state === "incomplete") return styles.stateWarn;
	return styles.stateUnknown;
}

function reachabilityLabel(
	value: boolean | null,
	t: ReturnType<typeof useTranslations>,
): string {
	if (value === true) return t("exposure.reachable");
	if (value === false) return t("exposure.blocked");
	return t("exposure.unknown");
}

function cacheDetails(
	cache: ProbeCacheEvidence | undefined,
	t: ReturnType<typeof useTranslations>,
): string[] {
	if (!cache) return [];
	const rows: string[] = [];
	if (cache.layer) rows.push(t("cache.layer", { layer: cache.layer }));
	if (typeof cache.ageSeconds === "number") {
		rows.push(t("cache.age", { seconds: Math.round(cache.ageSeconds) }));
	}
	if (cache.redisAvailable === true) rows.push(t("cache.redisAvailable"));
	if (cache.redisAvailable === false) rows.push(t("cache.redisUnavailable"));
	if (cache.refreshInProgress) rows.push(t("cache.refreshing"));
	return rows;
}

function ExposurePortRow({
	port,
	t,
}: Readonly<{
	port: ExposurePortEvidence;
	t: ReturnType<typeof useTranslations>;
}>) {
	return (
		<li className={styles.exposureRow} data-exposure-port={port.port}>
			<div>
				<strong>{port.service}</strong> <code>:{port.port}</code>
				<div className={styles.muted}>
					{t("exposure.observed", {
						state: reachabilityLabel(port.observedReachable, t),
					})}{" "}
					· {t("exposure.expected", {
						state: reachabilityLabel(port.expectedReachable, t),
					})}
				</div>
				<div className={styles.badges}>
					{port.accessPolicy === "trusted_sources_only" ? (
						<span>{t("exposure.trusted")}</span>
					) : null}
					{port.defaultAction === "deny" ? (
						<span>{t("exposure.defaultDeny")}</span>
					) : null}
					{port.negativeProbeRequired ? (
						<span>{t("exposure.negativeRequired")}</span>
					) : null}
				</div>
				{port.reason ? <div className={styles.detailText}>{port.reason}</div> : null}
			</div>
			<i
				className={`${STATE_ICON[port.state]} ${stateClass(port.state)}`}
				aria-hidden="true"
			/>
		</li>
	);
}

export default function HomelabOperationalExposure({
	evidence,
}: Readonly<{ evidence: HomelabObservabilitySnapshot }>) {
	const t = useTranslations("operations");
	const cloudflare = evidence.diagnostics?.cloudflare;
	const exposureEntries = useMemo(
		() =>
			Object.entries(evidence.diagnostics?.exposure_by_service ?? {}).sort(
				([leftId, left], [rightId, right]) =>
					EXPOSURE_PRIORITY[left.state] - EXPOSURE_PRIORITY[right.state] ||
					leftId.localeCompare(rightId),
			),
		[evidence.diagnostics?.exposure_by_service],
	);
	const mismatches = exposureEntries.filter(
		([, exposure]) => exposure.state === "mismatch",
	).length;

	return (
		<>
			<details className={styles.details} data-service-exposure-diagnostics>
				<summary>
					{t("serviceExposure.title")}
					{mismatches ? ` · ${mismatches} mismatch` : ""}
				</summary>
				<div className={styles.detailsBody}>
					<p>{t("serviceExposure.lead")}</p>
					{evidence.edgeEvidenceSkips.length ? (
						<div className={styles.providerSummary} data-edge-evidence-skips>
							<strong>{t("serviceExposure.skippedEdge")}</strong>
							{evidence.edgeEvidenceSkips.map((skip) => (
								<span key={skip.id}>
									{t("serviceExposure.skippedEdgeItem", {
										id: skip.id,
										reason: skip.reason,
									})}
								</span>
							))}
						</div>
					) : null}
					{cloudflare ? (
						<div className={styles.providerSummary} data-cloudflare-diagnostics>
							<strong>{t("serviceExposure.cloudflare")}</strong>
							<span>
								{t("serviceExposure.configured", {
									state: String(cloudflare.configured ?? "unknown"),
								})}
							</span>
							<span>
								{t("serviceExposure.tunnels", {
									count: cloudflare.tunnels_observed ?? 0,
								})}
							</span>
							<span>
								{t("serviceExposure.accessApps", {
									count: cloudflare.access_applications_observed ?? 0,
								})}
							</span>
							<span>
								{t("serviceExposure.tunnelObserver", {
									state: cloudflare.tunnel_observer_state ?? "unknown",
								})}
							</span>
							<span>
								{t("serviceExposure.accessObserver", {
									state: cloudflare.access_observer_state ?? "unknown",
								})}
							</span>
							{evidence.cloudflareCache?.stale ? (
								<span className={styles.stateWarn}>stale</span>
							) : null}
							{evidence.cloudflareCache?.refreshError ? (
								<span className={styles.stateWarn}>
									{evidence.cloudflareCache.refreshError}
								</span>
							) : null}
							{cacheDetails(evidence.cloudflareCache?.cache, t).map((row) => (
								<span key={row}>{row}</span>
							))}
						</div>
					) : null}
					{exposureEntries.length ? (
						<ul className={styles.evidenceList}>
							{exposureEntries.map(([id, exposure]) => (
								<li
									key={id}
									className={exposureStateClass(exposure.state)}
									data-service-exposure={id}
									data-service-exposure-state={exposure.state}
								>
									<div className={styles.evidenceHeading}>
										<strong>{id}</strong>
										<span className={styles.badge}>{exposure.state}</span>
									</div>
									<small>
										{t("serviceExposure.declared", {
											edge: exposure.declared.edge_mode ?? "unspecified",
										})}
									</small>
									<small>
										{t("serviceExposure.publicHttps", {
											state: String(
												exposure.observed.public_https_reachable ?? "unknown",
											),
										})}{" "}
										· {t("serviceExposure.tunnel", {
											state: String(
												exposure.observed.cloudflare_tunnel_observed ?? false,
											),
										})}{" "}
										· {t("serviceExposure.access", {
											state: String(
												exposure.observed.cloudflare_access_observed ?? false,
											),
										})}
									</small>
									{exposure.observed.cloudflare_access_public !== undefined &&
									exposure.observed.cloudflare_access_public !== null ? (
										<small>
											{t("serviceExposure.accessPublic", {
												state: String(
													exposure.observed.cloudflare_access_public,
												),
											})}
										</small>
									) : null}
									{exposure.reasons.map((reason) => (
										<small key={reason}>{reason}</small>
									))}
								</li>
							))}
						</ul>
					) : (
						<p>{t("serviceExposure.none")}</p>
					)}
				</div>
			</details>

			{evidence.exposurePorts.length ? (
				<details className={styles.details} data-trusted-source-exposure>
					<summary>{t("exposure.title")}</summary>
					<div className={styles.detailsBody}>
						<p>{t("exposure.lead")}</p>
						<ul className={styles.evidenceList}>
							{evidence.exposurePorts.map((port) => (
								<ExposurePortRow port={port} t={t} key={port.port} />
							))}
						</ul>
					</div>
				</details>
			) : null}
		</>
	);
}
