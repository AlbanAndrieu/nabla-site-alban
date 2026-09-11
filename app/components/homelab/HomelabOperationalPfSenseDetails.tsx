"use client";

import { useTranslations } from "next-intl";
import type { HomelabObservabilitySnapshot } from "@/lib/homelabObservability";
import styles from "./HomelabOperationalEvidence.module.css";

export default function HomelabOperationalPfSenseDetails({
	evidence,
	open,
	onToggle,
}: Readonly<{
	evidence: HomelabObservabilitySnapshot;
	open: boolean;
	onToggle: (open: boolean) => void;
}>) {
	const t = useTranslations("operations");
	const pfsenseIngress = evidence.diagnostics?.pfsense_ingress;
	if (!evidence.pfsense) return null;

	return (
		<details
			id="pfsense-operational-evidence"
			className={styles.details}
			data-pfsense-security-evidence
			open={open}
			onToggle={(event) => onToggle(event.currentTarget.open)}
		>
			<summary>{t("pfsense.details")}</summary>
			<div className={styles.detailsBody}>
				<h3>{t("pfsense.title")}</h3>
				{evidence.pfsense.ingressBlock?.state === "blocked" ? (
					<div className={styles.alertFail} role="alert">
						<strong>{t("pfsense.blocked")}</strong>
						<span>{t("pfsense.blockedDetail")}</span>
						{evidence.pfsense.ingressBlock.sourceIp &&
						evidence.pfsense.ingressBlock.destinationIp &&
						evidence.pfsense.ingressBlock.destinationPort ? (
							<code>
								{t("pfsense.sourceToDestination", {
									source: evidence.pfsense.ingressBlock.sourceIp,
									destination: evidence.pfsense.ingressBlock.destinationIp,
									port: evidence.pfsense.ingressBlock.destinationPort,
								})}
							</code>
						) : null}
						{evidence.pfsense.ingressBlock.evidence ? (
							<small>{evidence.pfsense.ingressBlock.evidence}</small>
						) : null}
					</div>
				) : null}
				{evidence.pfsense.ingressBlock?.controlPath?.blindSpot ? (
					<div className={styles.alertWarn} role="status">
						<strong>{t("pfsense.blindSpot")}</strong>
						<span>{t("pfsense.blindSpotDetail")}</span>
					</div>
				) : null}
				{evidence.pfsense.reason ? <p>{evidence.pfsense.reason}</p> : null}
				{pfsenseIngress ? (
					<div className={styles.telemetrySummary} data-pfsense-ingress-diagnostics>
						<span>
							{t("pfsense.telemetry", {
								state: pfsenseIngress.telemetry_available
									? "available"
									: "unavailable",
							})}
						</span>
						<span>
							{t("pfsense.attribution", {
								state: pfsenseIngress.attribution_available
									? "available"
									: "unavailable",
							})}
						</span>
						{pfsenseIngress.failure_stage || pfsenseIngress.error_kind ? (
							<span className={styles.stateWarn} data-current-probe-failure>
								{[
									pfsenseIngress.failure_stage,
									pfsenseIngress.error_kind,
									pfsenseIngress.exception_type,
								]
									.filter(Boolean)
									.join(" / ")}
							</span>
						) : null}
						{pfsenseIngress.last_success_at ? (
							<span>
								{t("pfsense.lastSuccess", {
									timestamp: pfsenseIngress.last_success_at,
								})}
							</span>
						) : null}
						{pfsenseIngress.cached !== undefined ? (
							<span>
								{pfsenseIngress.cached ? "cached" : "fresh"}
								{pfsenseIngress.cache_layer
									? ` · ${pfsenseIngress.cache_layer}`
									: ""}
								{typeof pfsenseIngress.cache_age_seconds === "number"
									? ` · ${Math.round(pfsenseIngress.cache_age_seconds)}s`
									: ""}
								{pfsenseIngress.stale ? " · stale" : ""}
							</span>
						) : null}
						{pfsenseIngress.redis_available === true ? (
							<span>{t("cache.redisAvailable")}</span>
						) : null}
						{pfsenseIngress.redis_available === false ? (
							<span>{t("cache.redisUnavailable")}</span>
						) : null}
						{pfsenseIngress.refresh_in_progress ? (
							<span>{t("cache.refreshing")}</span>
						) : null}
						{pfsenseIngress.stale && pfsenseIngress.evidence ? (
							<span data-last-good-evidence>{pfsenseIngress.evidence}</span>
						) : null}
						{pfsenseIngress.stale &&
						pfsenseIngress.last_known_match !== undefined ? (
							<span data-pfsense-last-known-match>
								{`last-known match: ${
									pfsenseIngress.last_known_match ? "yes" : "no"
								} · historical only`}
							</span>
						) : null}
						{pfsenseIngress.refresh_error ? (
							<span className={styles.stateWarn} data-current-probe-failure>
								{pfsenseIngress.refresh_error}
							</span>
						) : null}
					</div>
				) : null}
				<h4>{t("pfsense.filters")}</h4>
				<ul className={styles.evidenceList}>
					{evidence.pfsense.securityFilters.map((filter) => (
						<li key={filter.id}>
							<strong>{filter.label}</strong>
							<span className={styles.badge}>{filter.state}</span>
							<small>{filter.detail}</small>
						</li>
					))}
				</ul>
			</div>
		</details>
	);
}
