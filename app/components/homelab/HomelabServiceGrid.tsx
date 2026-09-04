"use client";

import { useTranslations } from "next-intl";
import type {
	HomelabHealthEntry,
	HomelabHealthSnapshot,
	HomelabHealthState,
} from "@/lib/homelabHealth";
import { reconcileHomelabHealth } from "@/lib/homelabHealthReconciliation";
import { homelabHealthColor } from "@/lib/homelabHealthPresentation";
import {
	blockedDependencyLabels,
	resolveEffectiveServiceState,
} from "@/lib/homelabHealthResolver";
import {
	type HomelabService,
	type HomelabServicesCatalog,
	homelabServiceEndpointUrl,
	homelabServiceId,
} from "@/lib/homelabServices";
import EndpointAction from "./EndpointAction";
import styles from "./HomelabServicesBlock.module.css";

type Props = {
	catalog: HomelabServicesCatalog;
	snapshot: HomelabHealthSnapshot | null;
	healthUnavailable?: boolean;
	healthHttpStatus?: number | null;
};

type HealthIndex = {
	byId: Map<string, HomelabHealthEntry>;
	byUrl: Map<string, HomelabHealthEntry>;
	byName: Map<string, HomelabHealthEntry>;
};

type RuntimePresentationState = HomelabHealthState | "missing";
type EffectiveHealthLabelKey =
	| "health.states.ok"
	| "health.states.warn"
	| "health.states.fail"
	| "health.states.unknown";

const EFFECTIVE_HEALTH_LABEL_KEY: Record<HomelabHealthState, EffectiveHealthLabelKey> = {
	ok: "health.states.ok",
	warn: "health.states.warn",
	fail: "health.states.fail",
	unknown: "health.states.unknown",
};

const EFFECTIVE_HEALTH_ICON_CLASS: Record<HomelabHealthState, string> = {
	ok: "fas fa-circle-check",
	warn: "fas fa-triangle-exclamation",
	fail: "fas fa-circle-xmark",
	unknown: "fas fa-circle-question",
};

const INTERNAL_HEALTH_CLASS: Record<HomelabHealthState, string> = {
	ok: "btn-outline-success",
	warn: "btn-outline-warning",
	fail: "btn-outline-danger",
	unknown: "btn-outline-secondary",
};

const RUNTIME_ICON_CLASS: Record<RuntimePresentationState, string> = {
	ok: "fas fa-circle-check",
	warn: "fas fa-triangle-exclamation",
	fail: "fas fa-circle-xmark",
	unknown: "fas fa-circle-question",
	missing: "fas fa-skull-crossbones",
};

function serviceIconPath(iconSrc?: string): string {
	if (!iconSrc) return "/assets/selfh-icons/generic-app.svg";
	if (/^https?:\/\//i.test(iconSrc)) return iconSrc;
	return `/${iconSrc}`;
}

function normalizedName(value: string): string {
	return value.trim().toLowerCase();
}

function healthIndex(snapshot: HomelabHealthSnapshot | null): HealthIndex {
	const byId = new Map<string, HomelabHealthEntry>();
	const byUrl = new Map<string, HomelabHealthEntry>();
	const byName = new Map<string, HomelabHealthEntry>();
	for (const entry of snapshot?.services ?? []) {
		if (entry.id) byId.set(entry.id, entry);
		byName.set(normalizedName(entry.name), entry);
		try {
			const url = new URL(entry.url);
			url.hash = "";
			byUrl.set(url.href, entry);
		} catch {
			// The same-origin proxy validates FastAPI payloads; ignore malformed extras defensively.
		}
	}
	return { byId, byUrl, byName };
}

function lookupHealth(
	index: HealthIndex,
	service: HomelabService,
	url: string,
): HomelabHealthEntry | undefined {
	const stableId = homelabServiceId(service);
	const byId = index.byId.get(stableId);
	if (byId) return byId;

	try {
		const normalized = new URL(url);
		normalized.hash = "";
		const byUrl = index.byUrl.get(normalized.href);
		if (byUrl) return byUrl;
	} catch {
		// Continue with the name fallback below.
	}

	return index.byName.get(normalizedName(service.name));
}

function serviceHealthEvidence(
	index: HealthIndex,
	service: HomelabService,
	url: string,
	snapshot: HomelabHealthSnapshot | null,
): HomelabHealthEntry | undefined {
	const generic = lookupHealth(index, service, url);
	if (homelabServiceId(service) !== "truenas" || !snapshot?.truenas?.public) {
		return generic;
	}

	const publicHealth = snapshot.truenas.public;
	return {
		...generic,
		...publicHealth,
		id: generic?.id ?? publicHealth.id ?? "truenas",
		name: generic?.name ?? publicHealth.name,
		url: publicHealth.url,
		// The clickable TrueNAS line represents only the direct public :7000
		// endpoint. Dependency/runtime health is deliberately kept out of this
		// navigation signal and remains visible through dedicated warnings.
		state: publicHealth.state,
		local_state: publicHealth.state,
		dependency_state: null,
		effective_state: publicHealth.state,
		required_dependencies: [],
		blocked_by: [],
		dependency_evidence: [],
		direct_state: publicHealth.state,
		internal_state:
			generic?.internal_state ?? snapshot.truenas.internal?.state ?? null,
	};
}

function reconciledHealth(
	entry: HomelabHealthEntry | undefined,
	service: HomelabService,
	schemaVersion?: number,
): HomelabHealthEntry | undefined {
	if (!entry) return undefined;
	// Schema v4+ is already reconciled server-side from HTTP, TrueNAS runtime,
	// internal probes, Cloudflare and (from v5) required dependencies. Do not
	// apply a second browser policy that could contradict the authoritative state.
	if ((schemaVersion ?? 0) >= 4) return entry;

	const reconciliation = reconcileHomelabHealth(entry, {
		external: service.external === true,
		tunnelExpected: service.tunnelSecure === true,
	});
	return { ...entry, state: reconciliation.state };
}

function runtimeHealthState(state?: string | null): HomelabHealthState | null {
	const normalized = state?.trim().toUpperCase();
	if (!normalized) return null;
	if (["ACTIVE", "HEALTHY", "RUNNING", "STARTED", "UP"].includes(normalized)) {
		return "ok";
	}
	if (["CRASHED", "DOWN", "ERROR", "FAILED", "STOPPED"].includes(normalized)) {
		return "fail";
	}
	return "warn";
}

function internalPresentationState(
	entry: HomelabHealthEntry | undefined,
): HomelabHealthState {
	return (
		entry?.internal_state ??
		runtimeHealthState(entry?.runtime_state) ??
		entry?.local_state ??
		entry?.state ??
		"unknown"
	);
}

function runtimePresentationState(
	entry: HomelabHealthEntry | undefined,
	dependsOnTrueNas: boolean,
	serviceId: string,
	runtimeUnavailable: boolean,
	runtimeStale: boolean,
): RuntimePresentationState | null {
	if (!dependsOnTrueNas || serviceId === "truenas") return null;
	if (runtimeUnavailable || runtimeStale) return "missing";
	return runtimeHealthState(entry?.runtime_state) ?? "missing";
}

export default function HomelabServiceGrid({
	catalog,
	snapshot,
	healthUnavailable = false,
	healthHttpStatus = null,
}: Props) {
	const t = useTranslations("homelab");
	const services: HomelabService[] = catalog.services;
	const serviceHealth = healthIndex(snapshot);
	const truenasPublic = snapshot?.truenas?.public;
	const truenasInternal = snapshot?.truenas?.internal;
	const truenasApi = snapshot?.truenas?.api;
	const truenasPublicUp =
		truenasPublic?.reachable === true && truenasPublic.state !== "fail";
	const truenasDown = !truenasPublicUp && snapshot?.truenas?.state === "fail";
	const truenasWarning =
		!truenasPublicUp && snapshot?.truenas?.state === "warn";
	const truenasRuntimeUnavailable =
		healthUnavailable ||
		truenasApi?.reachable === false ||
		snapshot?.truenas_runtime_reachable === false;
	const truenasRuntimeStale = snapshot?.truenas_runtime_stale === true;
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
	if (truenasRuntimeStale) {
		runtimeWarningDetails.push(t("truenas.runtimeStale"));
	}

	return (
		<>
			{(truenasDown || truenasWarning) && (
				<div
					className={`alert ${truenasDown ? "alert-danger" : "alert-warning"}`}
					role="alert"
				>
					<strong>
						<i className="fas fa-triangle-exclamation" aria-hidden="true" />{" "}
						{truenasDown ? t("truenas.down") : t("truenas.degraded")}
					</strong>
					{" — "}
					{t("truenas.publicProbe", {
						state: truenasPublic?.state ?? "unknown",
					})}
					{truenasInternal
						? `; ${t("truenas.internalProbe", {
								host: truenasInternal.host,
								port: truenasInternal.port,
								state: truenasInternal.state,
							})}`
						: `; ${t("truenas.internalUnavailable")}`}
					. {t("truenas.dependencyNote")}
				</div>
			)}

			{(truenasRuntimeUnavailable || truenasRuntimeStale) && (
				<div className="alert alert-warning" role="alert" data-truenas-runtime-warning>
					<strong>
						<i className="fas fa-triangle-exclamation" aria-hidden="true" />{" "}
						{t("truenas.runtimeDataUnavailable")}
					</strong>
					{" — "}
					{runtimeWarningDetails.join(" ")} {t("truenas.runtimeDependencyNote")}
				</div>
			)}

			<div className="row service-grid">
				{services.map((svc) => {
					const serviceId = homelabServiceId(svc);
					const hasInternal =
						typeof svc.internalHost === "string" && Boolean(svc.internalPort);
					const isExternal = svc.external === true;
					const endpointUrl = homelabServiceEndpointUrl(svc);
					const endpointEnabled = svc.endpointEnabled !== false;
					const initialHealth = reconciledHealth(
						serviceHealthEvidence(serviceHealth, svc, endpointUrl, snapshot),
						svc,
						snapshot?.schema_version,
					);
					const resolvedHealth = resolveEffectiveServiceState(initialHealth);
					const effectiveHealthLabel = t(
						EFFECTIVE_HEALTH_LABEL_KEY[resolvedHealth.effectiveState],
					);
					const blockerLabels = blockedDependencyLabels(initialHealth);
					const dependencyDegraded =
						blockerLabels.length > 0 ||
						resolvedHealth.localState !== resolvedHealth.effectiveState;
					const dependsOnTrueNas =
						svc.internalHost === "172.17.0.24" ||
						initialHealth?.runtime_app != null;
					const internalState = internalPresentationState(initialHealth);
					const internalColor = homelabHealthColor(internalState);
					const runtimeState = runtimePresentationState(
						initialHealth,
						dependsOnTrueNas,
						serviceId,
						truenasRuntimeUnavailable,
						truenasRuntimeStale,
					);
					const runtimeColor =
						runtimeState === "missing"
							? homelabHealthColor("unknown")
							: runtimeState
								? homelabHealthColor(runtimeState)
								: undefined;
					const runtimeTitle =
						runtimeState === "ok"
							? t("runtime.running", {
									state: initialHealth?.runtime_state ?? "RUNNING",
								})
							: runtimeState === "fail"
								? t("runtime.failed", {
										state: initialHealth?.runtime_state ?? "FAILED",
									})
								: runtimeState === "warn"
									? t("runtime.degraded", {
											state: initialHealth?.runtime_state ?? "UNKNOWN",
										})
									: runtimeState === "missing"
										? t("runtime.missing")
										: undefined;

					return (
						<div
							className="col-md-4 p-3"
							key={`${serviceId}:${endpointUrl}`}
						>
							<div
								className={`card box-shadow h-100 service-card-ux ${styles.serviceCard}`}
								data-effective-health={resolvedHealth.effectiveState}
							>
								<img
									className="img-fluid d-block mx-auto p-4"
									src={serviceIconPath(svc.iconSrc)}
									width={80}
									height={80}
									alt={svc.name}
									loading="lazy"
									decoding="async"
									style={{ minHeight: 60, minWidth: 60, height: "auto" }}
								/>
								<div className="card-body text-center border-top border-secondary">
									<div className={styles.serviceTitleRow}>
										<h3 className="h5 card-title mb-0">
											{svc.name}
											{runtimeState && runtimeTitle && (
												<i
													className={RUNTIME_ICON_CLASS[runtimeState]}
													style={{ color: runtimeColor, marginLeft: 8 }}
													title={runtimeTitle}
													aria-label={runtimeTitle}
													data-truenas-runtime-state={runtimeState}
												/>
											)}
										</h3>
										<span
											className={styles.serviceHealthBadge}
											data-health-state={resolvedHealth.effectiveState}
											aria-label={t("health.effectiveAria", {
												state: effectiveHealthLabel,
											})}
										>
											<i
												className={
													EFFECTIVE_HEALTH_ICON_CLASS[
														resolvedHealth.effectiveState
													]
												}
												aria-hidden="true"
											/>{" "}
											{effectiveHealthLabel}
										</span>
									</div>
									{initialHealth?.observation_stale === true && (
										<p className={styles.serviceFreshness} data-health-stale>
											<i className="fas fa-clock-rotate-left" aria-hidden="true" />{" "}
											{t("health.stale")}
										</p>
									)}
									<p className="card-text text-muted small mb-0">
										{svc.description}
									</p>
									{dependencyDegraded && (
										<div
											className="alert alert-warning py-2 px-2 small text-start mt-3 mb-0"
											role="status"
											data-dependency-health
										>
											<i className="fas fa-diagram-project" aria-hidden="true" />{" "}
											{blockerLabels.length > 0
												? t("dependency.blockedBy", {
														services: blockerLabels.join(" · "),
													})
												: t("dependency.degraded")}
											<span className="d-block text-muted mt-1">
												{t("dependency.stateSummary", {
													local: resolvedHealth.localState,
													effective: resolvedHealth.effectiveState,
												})}
											</span>
										</div>
									)}
									<div
										style={{
											marginTop: 18,
											display: "flex",
											flexDirection: "column",
											gap: 8,
										}}
									>
										<EndpointAction
											url={endpointUrl}
											enabled={endpointEnabled}
											external={isExternal}
											tunnelSecure={svc.tunnelSecure === true}
											label={t("endpoint.external")}
											initialHealth={initialHealth}
											snapshotCheckedAt={snapshot?.checked_at}
											truenasDown={truenasDown && dependsOnTrueNas}
										/>
										{hasInternal && (
											<a
												href={`${svc.internalSecure ? "https" : "http"}://${svc.internalHost}:${svc.internalPort}`}
												className={`btn ${INTERNAL_HEALTH_CLASS[internalState]} btn-sm d-block`}
												target="_blank"
												rel="noopener noreferrer"
												style={{ color: internalColor, borderColor: internalColor }}
												data-health-state={internalState}
												title={`FastAPI/TrueNAS: ${internalState}`}
											>
												{svc.internalSecure && (
													<i
														className="fas fa-lock"
														style={{ color: internalColor, marginRight: 5 }}
														title={t("truenas.internalTlsTitle")}
														aria-label={t("truenas.internalTlsAria")}
													/>
												)}
												{t("endpoint.internal")} ({svc.internalHost}:
												{svc.internalPort})
											</a>
										)}
									</div>
								</div>
							</div>
						</div>
					);
				})}
			</div>

			<div
				className="d-flex flex-wrap justify-content-center gap-3 small text-muted mt-3"
				role="note"
				aria-label={t("runtime.legendTitle")}
				data-truenas-runtime-legend
			>
				<strong>{t("runtime.legendTitle")}:</strong>
				<span>
					<i
						className={RUNTIME_ICON_CLASS.ok}
						style={{ color: homelabHealthColor("ok") }}
						aria-hidden="true"
					/>{" "}
					{t("runtime.legendRunning")}
				</span>
				<span>
					<i
						className={RUNTIME_ICON_CLASS.warn}
						style={{ color: homelabHealthColor("warn") }}
						aria-hidden="true"
					/>{" "}
					{t("runtime.legendDegraded")}
				</span>
				<span>
					<i
						className={RUNTIME_ICON_CLASS.fail}
						style={{ color: homelabHealthColor("fail") }}
						aria-hidden="true"
					/>{" "}
					{t("runtime.legendFailed")}
				</span>
				<span>
					<i
						className={RUNTIME_ICON_CLASS.missing}
						style={{ color: homelabHealthColor("unknown") }}
						aria-hidden="true"
					/>{" "}
					{t("runtime.legendMissing")}
				</span>
			</div>
			<div
				className="small text-muted text-center mt-2"
				role="note"
				aria-label={t("dependency.legendTitle")}
				data-dependency-health-legend
			>
				<strong>{t("dependency.legendTitle")}:</strong>{" "}
				{t("dependency.legend")}
			</div>
		</>
	);
}