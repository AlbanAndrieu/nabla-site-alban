"use client";

import { useTranslations } from "next-intl";
import type {
	HomelabHealthSnapshot,
	HomelabHealthState,
} from "@/lib/homelabHealth";
import {
	homelabHealthColor,
	homelabHealthTextColor,
} from "@/lib/homelabHealthPresentation";
import {
	blockedDependencyLabels,
	hasFreshRuntimeInventoryConflict,
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
import {
	EFFECTIVE_HEALTH_ICON_CLASS,
	EFFECTIVE_HEALTH_LABEL_KEY,
	endpointUrlHostIsPrivateS3,
	healthIndex,
	INTERNAL_HEALTH_CLASS,
	internalPresentationState,
	RUNTIME_ICON_CLASS,
	reconciledHealth,
	runtimePresentationState,
	serviceHealthEvidence,
	serviceIconPath,
} from "./homelabGridPresentation";
import ServiceHealthReasons from "./ServiceHealthReasons";

type Props = {
	catalog: HomelabServicesCatalog;
	snapshot: HomelabHealthSnapshot | null;
	healthUnavailable?: boolean;
	healthHttpStatus?: number | null;
};

export default function HomelabServiceGrid({
	catalog,
	snapshot,
	healthUnavailable = false,
	healthHttpStatus = null,
}: Props) {
	const t = useTranslations("homelab");
	// Show UI and APIs separately; public hostname routing is audited independently.
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
				<div
					className="alert alert-warning"
					role="alert"
					data-truenas-runtime-warning
				>
					<strong>
						<i className="fas fa-triangle-exclamation" aria-hidden="true" />{" "}
						{t("truenas.runtimeDataUnavailable")}
					</strong>
					{" — "}
					{runtimeWarningDetails.join(" ")} {t("truenas.runtimeDependencyNote")}
				</div>
			)}

			<div className="row service-grid">
				{services.map((svc, serviceIndex) => {
					const serviceId = homelabServiceId(svc);
					const hasInternal =
						typeof svc.internalHost === "string" && Boolean(svc.internalPort);
					const isExternal = svc.external === true;
					const isPrivateEndpoint = !isExternal;
					const privateExposureDebt =
						serviceId === "garage" &&
						endpointUrlHostIsPrivateS3(svc.tunnelUrl) &&
						isExternal;
					const endpointUrl = homelabServiceEndpointUrl(svc);
					const endpointEnabled = svc.endpointEnabled !== false;
					const initialHealth = reconciledHealth(
						serviceHealthEvidence(serviceHealth, svc, endpointUrl, snapshot),
						svc,
						snapshot?.schema_version,
					);
					const resolvedHealth = resolveEffectiveServiceState(initialHealth);
					const runtimeInventoryConflict =
						hasFreshRuntimeInventoryConflict(initialHealth);
					const presentationState: HomelabHealthState = healthUnavailable
						? "unknown"
						: resolvedHealth.effectiveState;
					const effectiveHealthLabel = t(
						EFFECTIVE_HEALTH_LABEL_KEY[presentationState],
					);
					const blockerLabels = blockedDependencyLabels(initialHealth);
					const dependencyDegraded =
						blockerLabels.length > 0 ||
						resolvedHealth.localState !== resolvedHealth.effectiveState;
					const dependsOnTrueNas =
						svc.internalHost === "172.17.0.24" ||
						initialHealth?.runtime_app != null;
					const internalState = internalPresentationState(
						initialHealth,
						truenasRuntimeUnavailable ||
							truenasRuntimeStale ||
							initialHealth?.runtime_stale === true ||
							initialHealth?.runtime_reachable === false,
					);
					const internalColor = homelabHealthTextColor(internalState);
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
							id={
								services.findIndex(
									(item) => homelabServiceId(item) === serviceId,
								) === serviceIndex
									? `homelab-service-${serviceId}`
									: undefined
							}
						>
							<div
								className={`card box-shadow h-100 service-card-ux ${styles.serviceCard}`}
								data-effective-health={presentationState}
								data-runtime-inventory-conflict={
									runtimeInventoryConflict ? "true" : undefined
								}
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
													role="img"
													aria-label={runtimeTitle}
													data-truenas-runtime-state={runtimeState}
												/>
											)}
										</h3>
										<span
											className={styles.serviceHealthBadge}
											data-health-state={presentationState}
											aria-label={t("health.effectiveAria", {
												state: effectiveHealthLabel,
											})}
										>
											<i
												className={
													EFFECTIVE_HEALTH_ICON_CLASS[presentationState]
												}
												aria-hidden="true"
											/>{" "}
											{effectiveHealthLabel}
										</span>
									</div>
									{initialHealth?.observation_stale === true && (
										<p className={styles.serviceFreshness} data-health-stale>
											<i
												className="fas fa-clock-rotate-left"
												aria-hidden="true"
											/>{" "}
											{t("health.stale")}
										</p>
									)}
									<p className="card-text text-muted small mb-0">
										{svc.description}
									</p>
									<ServiceHealthReasons
										entry={initialHealth}
										state={presentationState}
										tunnelExpected={svc.tunnelSecure === true}
										cloudflareConfigured={snapshot?.cloudflare_configured}
										runtimeStale={truenasRuntimeStale}
									/>
									{dependencyDegraded && (
										<div
											className="alert alert-warning py-2 px-2 small text-start mt-3 mb-0"
											role="status"
											data-dependency-health
										>
											<i
												className="fas fa-diagram-project"
												aria-hidden="true"
											/>{" "}
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
										{(isPrivateEndpoint || privateExposureDebt) && (
											<span
												className={`badge ${styles.internalBadge}`}
												title={
													privateExposureDebt
														? "Accès interne souhaité ; exception DNS publique encore déclarée"
														: "Accès Internet non souhaité ; disponibilité LAN vérifiée séparément"
												}
											>
												<i className="fas fa-lock me-1" aria-hidden="true" />
												Interne
												{privateExposureDebt ? " · exposition à corriger" : ""}
											</span>
										)}
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
												style={{
													color: internalColor,
													borderColor: internalColor,
												}}
												data-health-state={internalState}
												title={`FastAPI/TrueNAS: ${internalState}`}
											>
												{svc.internalSecure && (
													<i
														className="fas fa-lock"
														style={{ color: internalColor, marginRight: 5 }}
														title={t("truenas.internalTlsTitle")}
														role="img"
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
				<strong>{t("dependency.legendTitle")}:</strong> {t("dependency.legend")}
			</div>
		</>
	);
}
