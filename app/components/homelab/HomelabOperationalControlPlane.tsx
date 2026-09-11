"use client";

import { useTranslations } from "next-intl";
import type {
	HomelabObservabilitySnapshot,
	ProbeCacheEvidence,
} from "@/lib/homelabObservability";
import type {
	OperationalComponentEvidence,
	OperationalHealthState,
	TroubleshootingFocus,
} from "@/lib/homelabOperationalEvidence";
import styles from "./HomelabOperationalEvidence.module.css";
import PfSenseAttentionActions from "./PfSenseAttentionActions";

const STATE_ICON: Record<OperationalHealthState, string> = {
	ok: "fas fa-circle-check",
	warn: "fas fa-triangle-exclamation",
	fail: "fas fa-circle-xmark",
	unknown: "fas fa-circle-question",
};

const COMPONENT_LABEL_KEY = {
	truenas: "components.truenas",
	pfsense: "components.pfsense",
	cloudflare: "components.cloudflare",
} as const;

const STATE_LABEL_KEY = {
	ok: "components.ok",
	warn: "components.warn",
	fail: "components.fail",
	unknown: "components.unknown",
} as const;

const FOCUS_KEY: Record<TroubleshootingFocus, string> = {
	pfsense_block: "troubleshoot.pfsense_block",
	pfsense_blind_spot: "troubleshoot.pfsense_blind_spot",
	pfsense_control: "troubleshoot.pfsense_control",
	cloudflare: "troubleshoot.cloudflare",
	truenas: "troubleshoot.truenas",
	stale_evidence: "troubleshoot.stale_evidence",
	dependency_cycle: "troubleshoot.dependency_cycle",
	dependencies: "troubleshoot.dependencies",
};

const SOURCE_KEY = {
	"health-board": "sources.health-board",
	fallback: "sources.fallback",
	unavailable: "sources.unavailable",
} as const;

function stateClass(state: OperationalHealthState): string {
	return state === "ok"
		? styles.stateOk
		: state === "warn"
			? styles.stateWarn
			: state === "fail"
				? styles.stateFail
				: styles.stateUnknown;
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

function componentDetails(
	component: OperationalComponentEvidence,
	evidence: HomelabObservabilitySnapshot,
	t: ReturnType<typeof useTranslations>,
): string[] {
	const rows: string[] = [];
	const diagnostic = evidence.controlPlaneDiagnostics[component.id];
	if (typeof component.elapsedMs === "number") {
		rows.push(t("components.latency", { milliseconds: component.elapsedMs }));
	}
	if (component.failureStage) {
		rows.push(t("components.failureStage", { stage: component.failureStage }));
	}
	if (diagnostic?.probe)
		rows.push(t("components.probe", { probe: diagnostic.probe }));
	if (diagnostic?.path)
		rows.push(t("components.path", { path: diagnostic.path }));
	if (diagnostic?.exceptionType) {
		rows.push(
			t("components.exception", { exception: diagnostic.exceptionType }),
		);
	}
	if (typeof diagnostic?.retryAfterSeconds === "number") {
		rows.push(t("components.retry", { seconds: diagnostic.retryAfterSeconds }));
	}
	if (component.lastSuccessAt) {
		rows.push(
			t("components.lastSuccess", { timestamp: component.lastSuccessAt }),
		);
	}
	if (component.refreshError) {
		rows.push(t("components.refreshError", { error: component.refreshError }));
	} else if (component.error) {
		rows.push(component.error);
	}
	if (
		component.id === "cloudflare" &&
		typeof component.tunnelCount === "number" &&
		typeof component.healthyTunnels === "number"
	) {
		rows.push(
			t("components.tunnels", {
				healthy: component.healthyTunnels,
				count: component.tunnelCount,
			}),
		);
	}
	if (component.tunnelStatuses?.length) {
		rows.push(
			t("components.tunnelStatuses", {
				statuses: component.tunnelStatuses.join(" · "),
			}),
		);
	}
	rows.push(...cacheDetails(diagnostic?.cache, t));
	return rows;
}

export default function HomelabOperationalControlPlane({
	evidence,
	onInspectPfSense,
}: Readonly<{
	evidence: HomelabObservabilitySnapshot;
	onInspectPfSense: () => void;
}>) {
	const t = useTranslations("operations");
	const policy = evidence.pfsenseIngressPolicy;
	const pfsenseComponent = evidence.components.find(
		(component) => component.id === "pfsense",
	);

	return (
		<>
			<div
				className={styles.troubleshoot}
				data-troubleshooting-focus={evidence.troubleshootingFocus}
			>
				<strong>
					<i className="fas fa-stethoscope" aria-hidden="true" />{" "}
					{t("troubleshoot.title")}
				</strong>
				<span>{t(FOCUS_KEY[evidence.troubleshootingFocus])}</span>
			</div>

			<div
				className={styles.sourceRow}
				aria-label={t("sources.title")}
				data-observability-sources
			>
				<strong>{t("sources.title")}:</strong>
				<span>
					{t("sources.board")}: {t(SOURCE_KEY[evidence.sources.board])}
				</span>
				<span>
					{t("sources.runtime")}: {t(SOURCE_KEY[evidence.sources.runtime])}
				</span>
				<span>
					{t("sources.diagnostics")}:{" "}
					{t(SOURCE_KEY[evidence.sources.diagnostics])}
				</span>
			</div>

			<PfSenseAttentionActions
				component={pfsenseComponent}
				focus={evidence.troubleshootingFocus}
				hasEvidence={Boolean(evidence.pfsense)}
				onInspectEvidence={onInspectPfSense}
			/>

			{policy?.state === "possible_ingress_policy_block" ? (
				<div
					className={styles.alertWarn}
					role="status"
					data-pfsense-ingress-policy={policy.state}
				>
					<strong>{t("pfsense.ingressPolicy.title")}</strong>
					<span>{t("pfsense.ingressPolicy.lead")}</span>
					{policy.activeEgressIps.length ? (
						<code>
							{t("pfsense.ingressPolicy.egress", {
								ips: policy.activeEgressIps.join(" · "),
							})}
						</code>
					) : null}
					{policy.possibleCauses.length ? (
						<small>
							{t("pfsense.ingressPolicy.causes", {
								causes: policy.possibleCauses.join(" · "),
							})}
						</small>
					) : null}
					{policy.recommendedControlPath ? (
						<small>
							{t("pfsense.ingressPolicy.controlPath", {
								path: policy.recommendedControlPath,
							})}
						</small>
					) : null}
					{policy.detail ? <small>{policy.detail}</small> : null}
					{policy.attributionAvailable === false ? (
						<small>{t("pfsense.ingressPolicy.noAttribution")}</small>
					) : null}
				</div>
			) : null}

			<h3 className={styles.subheading}>{t("components.title")}</h3>
			<div className={styles.componentGrid}>
				{evidence.components.map((component) => {
					const details = componentDetails(component, evidence, t);
					return (
						<div
							className={`${styles.componentCard} ${stateClass(component.state)}`}
							key={component.id}
							data-operational-component={component.id}
							data-operational-state={component.state}
						>
							<div className={styles.componentHeader}>
								<strong>{t(COMPONENT_LABEL_KEY[component.id])}</strong>
								<i className={STATE_ICON[component.state]} aria-hidden="true" />
							</div>
							<div>{t(STATE_LABEL_KEY[component.state])}</div>
							{component.stale ? (
								<span className={styles.badge}>stale</span>
							) : null}
							{details.map((detail) => (
								<small className={styles.detailText} key={detail}>
									{detail}
								</small>
							))}
						</div>
					);
				})}
			</div>
		</>
	);
}
