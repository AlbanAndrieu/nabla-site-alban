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
import type { HomelabService } from "@/lib/homelabServices";
import EndpointAction from "./EndpointAction";
import styles from "./HomelabServicesBlock.module.css";
import {
	EFFECTIVE_HEALTH_ICON_CLASS,
	EFFECTIVE_HEALTH_LABEL_KEY,
	endpointUrlHostIsPrivateS3,
	type healthIndex,
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
	svc: HomelabService;
	siteState?: HomelabHealthState;
	serviceId: string;
	endpointUrl: string;
	anchorId?: string;
	snapshot: HomelabHealthSnapshot | null;
	serviceHealth: ReturnType<typeof healthIndex>;
	healthUnavailable: boolean;
	truenasDown: boolean;
	truenasRuntimeUnavailable: boolean;
	truenasRuntimeStale: boolean;
};

/** One homelab service card: effective health, runtime and endpoint links. */
export default function HomelabServiceCard({
	svc,
	siteState,
	serviceId,
	endpointUrl,
	anchorId,
	snapshot,
	serviceHealth,
	healthUnavailable,
	truenasDown,
	truenasRuntimeUnavailable,
	truenasRuntimeStale,
}: Props) {
	const t = useTranslations("homelab");
	const hasInternal =
		typeof svc.internalHost === "string" && Boolean(svc.internalPort);
	const isExternal = svc.external === true;
	const isPrivateEndpoint = !isExternal;
	const privateExposureDebt =
		serviceId === "garage" &&
		endpointUrlHostIsPrivateS3(svc.tunnelUrl) &&
		isExternal;
	const endpointEnabled = svc.endpointEnabled !== false;
	const initialHealth = reconciledHealth(
		serviceHealthEvidence(serviceHealth, svc, endpointUrl, snapshot),
		svc,
		snapshot?.schema_version,
	);
	const resolvedHealth = resolveEffectiveServiceState(initialHealth);
	const runtimeInventoryConflict =
		hasFreshRuntimeInventoryConflict(initialHealth);
	const presentationState: HomelabHealthState =
		initialHealth && !healthUnavailable
			? resolvedHealth.effectiveState
			: (siteState ?? "unknown");
	const effectiveHealthLabel = t(EFFECTIVE_HEALTH_LABEL_KEY[presentationState]);
	const blockerLabels = blockedDependencyLabels(initialHealth);
	const dependencyDegraded =
		blockerLabels.length > 0 ||
		resolvedHealth.localState !== resolvedHealth.effectiveState;
	const dependsOnTrueNas = initialHealth?.runtime_app != null;
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
		<div className="col-md-4 p-3" id={anchorId}>
			{anchorId?.startsWith("homelab-service-") && (
				<span
					id={anchorId.replace(/^homelab-service-/, "service-")}
					aria-hidden="true"
				/>
			)}
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
								className={EFFECTIVE_HEALTH_ICON_CLASS[presentationState]}
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
					<p className="card-text text-muted small mb-0">{svc.description}</p>
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
								{t("endpoint.internal")} ({svc.internalHost}:{svc.internalPort})
							</a>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
