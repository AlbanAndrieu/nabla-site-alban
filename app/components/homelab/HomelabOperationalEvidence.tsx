"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import AnchoredHeading from "@/components/AnchoredHeading";
import type {
	ExposurePortEvidence,
	HomelabOperationalEvidence,
	OperationalComponentEvidence,
	OperationalHealthState,
	TroubleshootingFocus,
} from "@/lib/homelabOperationalEvidence";
import styles from "./HomelabOperationalEvidence.module.css";
import PfSenseAttentionActions from "./PfSenseAttentionActions";

const REFRESH_MS = 30_000;

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

function stateClass(state: OperationalHealthState): string {
	return state === "ok"
		? styles.stateOk
		: state === "warn"
			? styles.stateWarn
			: state === "fail"
				? styles.stateFail
				: styles.stateUnknown;
}

function reachabilityLabel(
	value: boolean | null,
	t: ReturnType<typeof useTranslations>,
): string {
	if (value === true) return t("exposure.reachable");
	if (value === false) return t("exposure.blocked");
	return t("exposure.unknown");
}

function componentDetails(
	component: OperationalComponentEvidence,
	t: ReturnType<typeof useTranslations>,
): string[] {
	const rows: string[] = [];
	if (typeof component.elapsedMs === "number") {
		rows.push(t("components.latency", { milliseconds: component.elapsedMs }));
	}
	if (component.failureStage) {
		rows.push(t("components.failureStage", { stage: component.failureStage }));
	}
	if (component.lastSuccessAt) {
		rows.push(t("components.lastSuccess", { timestamp: component.lastSuccessAt }));
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
	return rows;
}

function ExposureRow({
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
			<i className={`${STATE_ICON[port.state]} ${stateClass(port.state)}`} aria-hidden="true" />
		</li>
	);
}

export default function HomelabOperationalEvidence() {
	const t = useTranslations("operations");
	const [evidence, setEvidence] = useState<HomelabOperationalEvidence | null>(null);
	const [refreshing, setRefreshing] = useState(true);
	const [unavailable, setUnavailable] = useState(false);

	useEffect(() => {
		let active = true;
		let controller: AbortController | null = null;

		const load = async () => {
			if (document.hidden) return;
			controller?.abort();
			controller = new AbortController();
			setRefreshing(true);
			try {
				const response = await fetch("/api/homelab-observability", {
					cache: "no-store",
					signal: controller.signal,
					headers: { Accept: "application/json" },
				});
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				const payload = (await response.json()) as HomelabOperationalEvidence;
				if (active) {
					setEvidence(payload);
					setUnavailable(false);
				}
			} catch {
				if (active && !controller.signal.aborted) setUnavailable(true);
			} finally {
				if (active && !controller.signal.aborted) setRefreshing(false);
			}
		};

		void load();
		const timer = window.setInterval(() => void load(), REFRESH_MS);
		const onVisibilityChange = () => {
			if (!document.hidden) void load();
		};
		document.addEventListener("visibilitychange", onVisibilityChange);
		return () => {
			active = false;
			controller?.abort();
			window.clearInterval(timer);
			document.removeEventListener("visibilitychange", onVisibilityChange);
		};
	}, []);

	const boardStatus = refreshing
		? t("board.refreshing")
		: unavailable && !evidence
			? t("board.unavailable")
			: evidence?.board.state === "pending"
				? t("board.pending")
				: evidence?.board.state === "stale"
					? t("board.stale")
					: t("board.fresh");
	const pfsenseComponent = evidence?.components.find(
		(component) => component.id === "pfsense",
	);

	return (
		<div
			id="operational-evidence"
			className={styles.panel}
			role="region"
			aria-labelledby="operational-evidence-title"
			data-homelab-operational-evidence
		>
			<div className={styles.header}>
				<div>
					<AnchoredHeading id="operational-evidence-title" as="h2" className={styles.title}>
						{t("title")}
					</AnchoredHeading>
					<p className={styles.lead}>{t("lead")}</p>
				</div>
				<div className={styles.boardStatus} role="status" aria-live="polite">
					{refreshing || evidence?.board.refreshing ? (
						<i className="fas fa-rotate fa-spin" aria-hidden="true" />
					) : (
						<i className="fas fa-clock-rotate-left" aria-hidden="true" />
					)}{" "}
					{boardStatus}
					{typeof evidence?.board.ageSeconds === "number"
						? ` · ${t("board.age", { seconds: Math.round(evidence.board.ageSeconds) })}`
						: ""}
					{typeof evidence?.refreshElapsedMs === "number"
						? ` · ${t("board.probeDuration", { milliseconds: evidence.refreshElapsedMs })}`
						: ""}
				</div>
			</div>

			{evidence ? (
				<>
					<div className={styles.troubleshoot} data-troubleshooting-focus={evidence.troubleshootingFocus}>
						<strong>
							<i className="fas fa-stethoscope" aria-hidden="true" /> {t("troubleshoot.title")}
						</strong>
						<span>{t(FOCUS_KEY[evidence.troubleshootingFocus])}</span>
					</div>

					<PfSenseAttentionActions
						component={pfsenseComponent}
						focus={evidence.troubleshootingFocus}
						hasEvidence={Boolean(evidence.pfsense)}
					/>

					<h3 className={styles.subheading}>{t("components.title")}</h3>
					<div className={styles.componentGrid}>
						{evidence.components.map((component) => {
							const details = componentDetails(component, t);
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
									{component.stale ? <span className={styles.badge}>stale</span> : null}
									{details.map((detail) => (
										<small className={styles.detailText} key={detail}>{detail}</small>
									))}
								</div>
							);
						})}
					</div>

					{evidence.pfsense ? (
						<details
							id="pfsense-operational-evidence"
							className={styles.details}
							data-pfsense-security-evidence
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
					) : null}

					{evidence.exposurePorts.length ? (
						<details className={styles.details} data-trusted-source-exposure>
							<summary>{t("exposure.title")}</summary>
							<div className={styles.detailsBody}>
								<p>{t("exposure.lead")}</p>
								<ul className={styles.evidenceList}>
									{evidence.exposurePorts.map((port) => (
										<ExposureRow port={port} t={t} key={port.port} />
									))}
								</ul>
							</div>
						</details>
					) : null}

					<details className={styles.details} data-evidence-freshness>
						<summary>{t("freshness.title")}</summary>
						<div className={styles.detailsBody}>
							{evidence.staleServices.length === 0 && evidence.dependencyCycles.length === 0 ? (
								<p>{t("freshness.none")}</p>
							) : null}
							{evidence.staleServices.length ? (
								<>
									<strong>{t("freshness.stale", { count: evidence.staleServices.length })}</strong>
									<ul>
										{evidence.staleServices.map((service) => (
											<li key={service.id}>
												{service.name}
												{typeof service.observationAgeSeconds === "number"
													? ` · ${t("freshness.age", { seconds: service.observationAgeSeconds })}`
													: ""}
											</li>
										))}
									</ul>
								</>
							) : null}
							{evidence.dependencyCycles.length ? (
								<>
									<strong>{t("freshness.cycles", { count: evidence.dependencyCycles.length })}</strong>
									<ul>
										{evidence.dependencyCycles.map((cycle) => (
											<li key={cycle.members.join("→")}>{cycle.members.join(" → ")}</li>
										))}
									</ul>
								</>
							) : null}
						</div>
					</details>

					{evidence.providerCredentials.length ? (
						<details className={styles.details} data-provider-credential-evidence>
							<summary>{t("credentials.title")}</summary>
							<div className={styles.detailsBody}>
								<p>{t("credentials.lead")}</p>
								<ul className={styles.evidenceList}>
									{evidence.providerCredentials.map((credential) => (
										<li key={credential.provider}>
											<strong>{credential.provider}</strong>{" "}
											<span className={styles.badge}>
												{credential.configured
													? t("credentials.configured")
													: t("credentials.missing")}
											</span>
											{credential.credentialMode ? (
												<small>{t("credentials.mode", { mode: credential.credentialMode })}</small>
											) : null}
											{credential.missingVariables.length ? (
												<small>
													{t("credentials.missingVariables", {
														variables: credential.missingVariables.join(", "),
													})}
												</small>
											) : null}
											{credential.requiredPrivilege ? (
												<small>{t("credentials.privilege", { privilege: credential.requiredPrivilege })}</small>
											) : null}
											{credential.writePrivilegesRequired === false ? (
												<small>{t("credentials.readOnly")}</small>
											) : null}
										</li>
									))}
								</ul>
							</div>
						</details>
					) : null}
				</>
			) : (
				<div className={styles.emptyState} role={unavailable ? "alert" : "status"}>
					{boardStatus}
				</div>
			)}
		</div>
	);
}
