"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import AnchoredHeading from "@/components/AnchoredHeading";
import type { HomelabExposureEvidence } from "@/lib/homelabDiagnostics";
import type {
	DeepDiagnosticCategory,
	DeepDiagnosticCheckEvidence,
	HomelabObservabilitySnapshot,
	ProbeCacheEvidence,
} from "@/lib/homelabObservability";
import type {
	ExposurePortEvidence,
	OperationalComponentEvidence,
	OperationalHealthState,
	TroubleshootingFocus,
} from "@/lib/homelabOperationalEvidence";
import styles from "./HomelabOperationalEvidence.module.css";
import PfSenseAttentionActions from "./PfSenseAttentionActions";
import PfSenseDnsPosture from "./PfSenseDnsPosture";

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

const CATEGORY_KEY: Record<DeepDiagnosticCategory, string> = {
	required: "deep.required",
	"control-plane": "deep.control-plane",
	integration: "deep.integration",
	homelab: "deep.homelab",
};

const SOURCE_KEY = {
	"health-board": "sources.health-board",
	fallback: "sources.fallback",
	unavailable: "sources.unavailable",
} as const;

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
	if (diagnostic?.probe) rows.push(t("components.probe", { probe: diagnostic.probe }));
	if (diagnostic?.path) rows.push(t("components.path", { path: diagnostic.path }));
	if (diagnostic?.exceptionType) {
		rows.push(t("components.exception", { exception: diagnostic.exceptionType }));
	}
	if (typeof diagnostic?.retryAfterSeconds === "number") {
		rows.push(t("components.retry", { seconds: diagnostic.retryAfterSeconds }));
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
	rows.push(...cacheDetails(diagnostic?.cache, t));
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
					{port.accessPolicy === "trusted_sources_only" ? <span>{t("exposure.trusted")}</span> : null}
					{port.defaultAction === "deny" ? <span>{t("exposure.defaultDeny")}</span> : null}
					{port.negativeProbeRequired ? <span>{t("exposure.negativeRequired")}</span> : null}
				</div>
				{port.reason ? <div className={styles.detailText}>{port.reason}</div> : null}
			</div>
			<i className={`${STATE_ICON[port.state]} ${stateClass(port.state)}`} aria-hidden="true" />
		</li>
	);
}

function DeepCheckRow({
	check,
	t,
}: Readonly<{
	check: DeepDiagnosticCheckEvidence;
	t: ReturnType<typeof useTranslations>;
}>) {
	const metadata = [
		check.skipped ? t("deep.skipped") : null,
		typeof check.httpStatus === "number" ? t("deep.http", { status: check.httpStatus }) : null,
		check.tlsTrusted === true ? t("deep.tlsTrusted") : null,
		check.tlsTrusted === false ? t("deep.tlsUntrusted") : null,
		typeof check.elapsedMs === "number" ? t("deep.latency", { milliseconds: check.elapsedMs }) : null,
		check.probe ? t("deep.probe", { probe: check.probe }) : null,
		check.authentication ? t("deep.authentication", { authentication: check.authentication }) : null,
		check.resource ? t("deep.resource", { resource: check.resource }) : null,
		check.path ? t("deep.path", { path: check.path }) : null,
		check.target ? t("deep.target", { target: check.target }) : null,
		...cacheDetails(check.cache, t),
	].filter((value): value is string => Boolean(value));

	return (
		<li data-deep-diagnostic-check={check.id} data-deep-diagnostic-state={check.state}>
			<div className={styles.evidenceHeading}>
				<strong>{check.label}</strong>
				<i className={`${STATE_ICON[check.state]} ${stateClass(check.state)}`} aria-hidden="true" />
			</div>
			{metadata.length ? <small>{metadata.join(" · ")}</small> : null}
			{check.reason ? <small>{check.reason}</small> : null}
			{check.error ? (
				<small className={check.state === "fail" ? styles.stateFail : styles.stateWarn}>
					{[check.errorKind, check.exceptionType, check.error].filter(Boolean).join(" · ")}
				</small>
			) : null}
		</li>
	);
}

export default function HomelabOperationalEvidence() {
	const t = useTranslations("operations");
	const [evidence, setEvidence] = useState<HomelabObservabilitySnapshot | null>(null);
	const [refreshing, setRefreshing] = useState(true);
	const [unavailable, setUnavailable] = useState(false);
	const [pfsenseOpen, setPfSenseOpen] = useState(false);

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
				const payload = (await response.json()) as HomelabObservabilitySnapshot;
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
	const pfsenseComponent = evidence?.components.find((component) => component.id === "pfsense");
	const pfsenseIngress = evidence?.diagnostics?.pfsense_ingress;
	const runtime = evidence?.runtimeTopology;
	const truenasApi = evidence?.diagnostics?.truenas_api;
	const cloudflare = evidence?.diagnostics?.cloudflare;
	const exposureEntries = useMemo(
		() =>
			Object.entries(evidence?.diagnostics?.exposure_by_service ?? {}).sort(
				([leftId, left], [rightId, right]) =>
					EXPOSURE_PRIORITY[left.state] - EXPOSURE_PRIORITY[right.state] || leftId.localeCompare(rightId),
			),
		[evidence?.diagnostics?.exposure_by_service],
	);

	const openPfSenseEvidence = () => {
		setPfSenseOpen(true);
		window.requestAnimationFrame(() => {
			document.getElementById("pfsense-operational-evidence")?.scrollIntoView({
				block: "start",
				behavior: "smooth",
			});
		});
	};

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
					<i className={refreshing || evidence?.board.refreshing ? "fas fa-rotate fa-spin" : "fas fa-clock-rotate-left"} aria-hidden="true" />{" "}
					{boardStatus}
					{typeof evidence?.board.ageSeconds === "number" ? ` · ${t("board.age", { seconds: Math.round(evidence.board.ageSeconds) })}` : ""}
					{typeof evidence?.refreshElapsedMs === "number" ? ` · ${t("board.probeDuration", { milliseconds: evidence.refreshElapsedMs })}` : ""}
				</div>
			</div>

			{evidence ? (
				<>
					<div className={styles.troubleshoot} data-troubleshooting-focus={evidence.troubleshootingFocus}>
						<strong><i className="fas fa-stethoscope" aria-hidden="true" /> {t("troubleshoot.title")}</strong>
						<span>{t(FOCUS_KEY[evidence.troubleshootingFocus])}</span>
					</div>

					<div className={styles.sourceRow} aria-label={t("sources.title")} data-observability-sources>
						<strong>{t("sources.title")}:</strong>
						<span>{t("sources.board")}: {t(SOURCE_KEY[evidence.sources.board])}</span>
						<span>{t("sources.runtime")}: {t(SOURCE_KEY[evidence.sources.runtime])}</span>
						<span>{t("sources.diagnostics")}: {t(SOURCE_KEY[evidence.sources.diagnostics])}</span>
					</div>

					<PfSenseAttentionActions
						component={pfsenseComponent}
						focus={evidence.troubleshootingFocus}
						hasEvidence={Boolean(evidence.pfsense)}
						onInspectEvidence={openPfSenseEvidence}
					/>

					<h3 className={styles.subheading}>{t("components.title")}</h3>
					<div className={styles.componentGrid}>
						{evidence.components.map((component) => {
							const details = componentDetails(component, evidence, t);
							return (
								<div className={`${styles.componentCard} ${stateClass(component.state)}`} key={component.id} data-operational-component={component.id} data-operational-state={component.state}>
									<div className={styles.componentHeader}>
										<strong>{t(COMPONENT_LABEL_KEY[component.id])}</strong>
										<i className={STATE_ICON[component.state]} aria-hidden="true" />
									</div>
									<div>{t(STATE_LABEL_KEY[component.state])}</div>
									{component.stale ? <span className={styles.badge}>stale</span> : null}
									{details.map((detail) => <small className={styles.detailText} key={detail}>{detail}</small>)}
								</div>
							);
						})}
					</div>

					{evidence.healthSnapshot?.pfsense?.dns ? (
						<PfSenseDnsPosture
							snapshot={evidence.healthSnapshot}
							healthUnavailable={unavailable || evidence.board.state === "stale"}
						/>
					) : null}

					<details className={styles.details} data-runtime-transport-evidence>
						<summary>{t("runtime.title")}</summary>
						<div className={styles.detailsBody}>
							<p>{t("runtime.lead")}</p>
							<div className={styles.splitGrid}>
								<div>
									<h3>FastAPI Cloud</h3>
									{runtime ? (
										<>
											<ul className={styles.compactList}>
												<li>{t("runtime.provider", { provider: runtime.provider })}</li>
												<li>{t("runtime.observed", { timestamp: runtime.observed_at })}</li>
												<li>{t("runtime.instances", { count: runtime.observed_instance_count })}</li>
												{runtime.aggregation ? <li>{t("runtime.aggregation", { aggregation: runtime.aggregation })}{runtime.degraded ? " · degraded" : ""}</li> : null}
												<li>{t("runtime.activeEgress", { ips: runtime.active_egress_ips.join(" · ") || "none" })}</li>
												<li>{t("runtime.recentEgress", { ips: runtime.recent_egress_ips.join(" · ") || "none" })}</li>
												{runtime.heartbeat_interval_seconds && runtime.active_window_seconds && runtime.recent_egress_window_seconds ? (
													<li>{t("runtime.windows", { heartbeat: runtime.heartbeat_interval_seconds, active: runtime.active_window_seconds, recent: runtime.recent_egress_window_seconds })}</li>
												) : null}
											</ul>
											{runtime.instances.length ? (
												<ul className={styles.evidenceList}>
													{runtime.instances.map((instance) => (
														<li key={instance.id}>{t("runtime.instance", { id: instance.id, lastSeen: instance.last_seen_at ?? "unknown", egress: instance.egress_ip ?? "unknown" })}{instance.egress_cached ? " · cached egress" : ""}</li>
													))}
												</ul>
											) : null}
											<small className={styles.detailText}>{runtime.count_semantics || t("runtime.countSemantics")}</small>
										</>
									) : <p>{t("runtime.unavailable")}</p>}
								</div>
								<div data-truenas-api-diagnostics>
									<h3>{t("runtime.truenas")}</h3>
									{truenasApi ? (
										<ul className={styles.compactList}>
											<li className={truenasApi.reachable ? styles.stateOk : styles.stateWarn}>{truenasApi.reachable ? t("runtime.reachable") : t("runtime.unreachable")}{truenasApi.phase || truenasApi.stage ? ` · ${truenasApi.phase ?? "?"}/${truenasApi.stage ?? "?"}` : ""}</li>
											{typeof truenasApi.elapsed_ms === "number" ? <li>{t("components.latency", { milliseconds: truenasApi.elapsed_ms })}</li> : null}
											{truenasApi.cached !== undefined ? <li>{truenasApi.cached ? "cached" : "fresh"}{typeof truenasApi.cache_age_seconds === "number" ? ` · ${Math.round(truenasApi.cache_age_seconds)}s` : ""}{truenasApi.stale ? " · stale" : ""}</li> : null}
											{truenasApi.last_success_at ? <li>{t("components.lastSuccess", { timestamp: truenasApi.last_success_at })}</li> : null}
											{truenasApi.last_good_available ? <li>{t("runtime.lastGood")}</li> : null}
											{truenasApi.error ? <li className={styles.stateWarn}>{[truenasApi.exception_type, truenasApi.error].filter(Boolean).join(" · ")}</li> : null}
											{typeof truenasApi.retry_after_seconds === "number" ? <li>{t("components.retry", { seconds: truenasApi.retry_after_seconds })}</li> : null}
										</ul>
									) : <p>{t("runtime.unavailable")}</p>}
								</div>
							</div>
						</div>
					</details>

					<details className={styles.details} data-deep-diagnostics>
						<summary>{t("deep.title")}{evidence.deepDiagnostics.status ? ` · ${evidence.deepDiagnostics.status}` : ""}</summary>
						<div className={styles.detailsBody}>
							<p>{t("deep.lead")}</p>
							<div className={styles.badges}>
								{evidence.deepDiagnostics.status ? <span>{t("deep.status", { status: evidence.deepDiagnostics.status })}</span> : null}
								{evidence.deepDiagnostics.contract ? <span>{t("deep.contract", { contract: evidence.deepDiagnostics.contract })}</span> : null}
								{evidence.deepDiagnostics.version ? <span>{t("deep.version", { version: evidence.deepDiagnostics.version })}</span> : null}
							</div>
							{evidence.deepDiagnostics.checks.length ? (
								(["required", "control-plane", "integration", "homelab"] as const).map((category) => {
									const checks = evidence.deepDiagnostics.checks.filter((check) => check.category === category);
									if (!checks.length) return null;
									return (
										<section key={category} className={styles.diagnosticGroup} aria-labelledby={`deep-${category}`}>
											<h3 id={`deep-${category}`}>{t(CATEGORY_KEY[category])}</h3>
											<ul className={styles.evidenceList}>{checks.map((check) => <DeepCheckRow check={check} t={t} key={check.id} />)}</ul>
										</section>
									);
								})
							) : <p>{t("deep.none")}</p>}
						</div>
					</details>

					{evidence.pfsense ? (
						<details id="pfsense-operational-evidence" className={styles.details} data-pfsense-security-evidence open={pfsenseOpen} onToggle={(event) => setPfSenseOpen(event.currentTarget.open)}>
							<summary>{t("pfsense.details")}</summary>
							<div className={styles.detailsBody}>
								<h3>{t("pfsense.title")}</h3>
								{evidence.pfsense.ingressBlock?.state === "blocked" ? (
									<div className={styles.alertFail} role="alert">
										<strong>{t("pfsense.blocked")}</strong><span>{t("pfsense.blockedDetail")}</span>
										{evidence.pfsense.ingressBlock.sourceIp && evidence.pfsense.ingressBlock.destinationIp && evidence.pfsense.ingressBlock.destinationPort ? <code>{t("pfsense.sourceToDestination", { source: evidence.pfsense.ingressBlock.sourceIp, destination: evidence.pfsense.ingressBlock.destinationIp, port: evidence.pfsense.ingressBlock.destinationPort })}</code> : null}
										{evidence.pfsense.ingressBlock.evidence ? <small>{evidence.pfsense.ingressBlock.evidence}</small> : null}
									</div>
								) : null}
								{evidence.pfsense.ingressBlock?.controlPath?.blindSpot ? <div className={styles.alertWarn} role="status"><strong>{t("pfsense.blindSpot")}</strong><span>{t("pfsense.blindSpotDetail")}</span></div> : null}
								{evidence.pfsense.reason ? <p>{evidence.pfsense.reason}</p> : null}
								{pfsenseIngress ? (
									<div className={styles.telemetrySummary} data-pfsense-ingress-diagnostics>
										<span>{t("pfsense.telemetry", { state: pfsenseIngress.telemetry_available ? "available" : "unavailable" })}</span>
										<span>{t("pfsense.attribution", { state: pfsenseIngress.attribution_available ? "available" : "unavailable" })}</span>
										{pfsenseIngress.failure_stage || pfsenseIngress.error_kind ? <span className={styles.stateWarn}>{[pfsenseIngress.failure_stage, pfsenseIngress.error_kind, pfsenseIngress.exception_type].filter(Boolean).join(" / ")}</span> : null}
										{pfsenseIngress.last_success_at ? <span>{t("pfsense.lastSuccess", { timestamp: pfsenseIngress.last_success_at })}</span> : null}
										{pfsenseIngress.cached !== undefined ? <span>{pfsenseIngress.cached ? "cached" : "fresh"}{typeof pfsenseIngress.cache_age_seconds === "number" ? ` · ${Math.round(pfsenseIngress.cache_age_seconds)}s` : ""}{pfsenseIngress.stale ? " · stale" : ""}</span> : null}
										{pfsenseIngress.refresh_error ? <span className={styles.stateWarn}>{pfsenseIngress.refresh_error}</span> : null}
									</div>
								) : null}
								<h4>{t("pfsense.filters")}</h4>
								<ul className={styles.evidenceList}>
									{evidence.pfsense.securityFilters.map((filter) => <li key={filter.id}><strong>{filter.label}</strong><span className={styles.badge}>{filter.state}</span><small>{filter.detail}</small></li>)}
								</ul>
							</div>
						</details>
					) : null}

					<details className={styles.details} data-service-exposure-diagnostics>
						<summary>{t("serviceExposure.title")}{exposureEntries.filter(([, exposure]) => exposure.state === "mismatch").length ? ` · ${exposureEntries.filter(([, exposure]) => exposure.state === "mismatch").length} mismatch` : ""}</summary>
						<div className={styles.detailsBody}>
							<p>{t("serviceExposure.lead")}</p>
							{cloudflare ? (
								<div className={styles.providerSummary} data-cloudflare-diagnostics>
									<strong>{t("serviceExposure.cloudflare")}</strong>
									<span>{t("serviceExposure.configured", { state: String(cloudflare.configured ?? "unknown") })}</span>
									<span>{t("serviceExposure.tunnels", { count: cloudflare.tunnels_observed ?? 0 })}</span>
									<span>{t("serviceExposure.accessApps", { count: cloudflare.access_applications_observed ?? 0 })}</span>
									<span>{t("serviceExposure.tunnelObserver", { state: cloudflare.tunnel_observer_state ?? "unknown" })}</span>
									<span>{t("serviceExposure.accessObserver", { state: cloudflare.access_observer_state ?? "unknown" })}</span>
									{evidence.cloudflareCache?.stale ? <span className={styles.stateWarn}>stale</span> : null}
									{evidence.cloudflareCache?.refreshError ? <span className={styles.stateWarn}>{evidence.cloudflareCache.refreshError}</span> : null}
									{cacheDetails(evidence.cloudflareCache?.cache, t).map((row) => <span key={row}>{row}</span>)}
								</div>
							) : null}
							{exposureEntries.length ? (
								<ul className={styles.evidenceList}>
									{exposureEntries.map(([id, exposure]) => (
										<li key={id} className={exposureStateClass(exposure.state)} data-service-exposure={id} data-service-exposure-state={exposure.state}>
											<div className={styles.evidenceHeading}><strong>{id}</strong><span className={styles.badge}>{exposure.state}</span></div>
											<small>{t("serviceExposure.declared", { edge: exposure.declared.edge_mode ?? "unspecified" })}</small>
											<small>{t("serviceExposure.publicHttps", { state: String(exposure.observed.public_https_reachable ?? "unknown") })} · {t("serviceExposure.tunnel", { state: String(exposure.observed.cloudflare_tunnel_observed ?? false) })} · {t("serviceExposure.access", { state: String(exposure.observed.cloudflare_access_observed ?? false) })}</small>
											{exposure.observed.cloudflare_access_public !== undefined && exposure.observed.cloudflare_access_public !== null ? <small>{t("serviceExposure.accessPublic", { state: String(exposure.observed.cloudflare_access_public) })}</small> : null}
											{exposure.reasons.map((reason) => <small key={reason}>{reason}</small>)}
										</li>
									))}
								</ul>
							) : <p>{t("serviceExposure.none")}</p>}
						</div>
					</details>

					{evidence.exposurePorts.length ? (
						<details className={styles.details} data-trusted-source-exposure>
							<summary>{t("exposure.title")}</summary>
							<div className={styles.detailsBody}><p>{t("exposure.lead")}</p><ul className={styles.evidenceList}>{evidence.exposurePorts.map((port) => <ExposurePortRow port={port} t={t} key={port.port} />)}</ul></div>
						</details>
					) : null}

					<details className={styles.details} data-evidence-freshness>
						<summary>{t("freshness.title")}</summary>
						<div className={styles.detailsBody}>
							{evidence.staleServices.length === 0 && evidence.dependencyCycles.length === 0 ? <p>{t("freshness.none")}</p> : null}
							{evidence.staleServices.length ? <><strong>{t("freshness.stale", { count: evidence.staleServices.length })}</strong><ul>{evidence.staleServices.map((service) => <li key={service.id}>{service.name}{typeof service.observationAgeSeconds === "number" ? ` · ${t("freshness.age", { seconds: service.observationAgeSeconds })}` : ""}</li>)}</ul></> : null}
							{evidence.dependencyCycles.length ? <><strong>{t("freshness.cycles", { count: evidence.dependencyCycles.length })}</strong><ul>{evidence.dependencyCycles.map((cycle) => <li key={cycle.members.join("→")}>{cycle.members.join(" → ")}</li>)}</ul></> : null}
						</div>
					</details>

					{evidence.providerCredentials.length ? (
						<details className={styles.details} data-provider-credential-evidence>
							<summary>{t("credentials.title")}</summary>
							<div className={styles.detailsBody}>
								<p>{t("credentials.lead")}</p>
								<ul className={styles.evidenceList}>{evidence.providerCredentials.map((credential) => <li key={credential.provider}><strong>{credential.provider}</strong> <span className={styles.badge}>{credential.configured ? t("credentials.configured") : t("credentials.missing")}</span>{credential.credentialMode ? <small>{t("credentials.mode", { mode: credential.credentialMode })}</small> : null}{credential.missingVariables.length ? <small>{t("credentials.missingVariables", { variables: credential.missingVariables.join(", ") })}</small> : null}{credential.requiredPrivilege ? <small>{t("credentials.privilege", { privilege: credential.requiredPrivilege })}</small> : null}{credential.writePrivilegesRequired === false ? <small>{t("credentials.readOnly")}</small> : null}</li>)}</ul>
							</div>
						</details>
					) : null}
				</>
			) : <div className={styles.emptyState} role={unavailable ? "alert" : "status"}>{boardStatus}</div>}
		</div>
	);
}