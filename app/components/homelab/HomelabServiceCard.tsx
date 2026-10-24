"use client";

import { useLocale, useTranslations } from "next-intl";
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
import { homelabServiceDisplayName, type HomelabService } from "@/lib/homelabServices";
import { homelabServiceIconSrc } from "@/lib/homelabCatalogIcons";
import EndpointAction from "./EndpointAction";
import styles from "./HomelabServicesBlock.module.css";
import {
	EFFECTIVE_HEALTH_ICON_CLASS,
	EFFECTIVE_HEALTH_LABEL_KEY,
	endpointUrlHostIsPrivateS3,
	type healthIndex,
	INTERNAL_HEALTH_CLASS,
	RUNTIME_ICON_CLASS,
	reconciledHealth,
	runtimePresentationState,
	serviceHealthEvidence,
	serviceIconPath,
} from "./homelabGridPresentation";
import ServiceHealthReasons from "./ServiceHealthReasons";
import ServiceOwnerEvidenceSummary from "./ServiceOwnerEvidenceSummary";
import { describeServiceProbe } from "@/lib/homelabProbeEvidencePresentation";

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
	readOnly?: boolean;
	externalUrlDerived?: boolean;
	internalProtocolObserved?: boolean;
	internalRouteMismatch?: boolean;
	internalTargetSource?: "probe" | "declared" | "none";
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
	readOnly = false,
	externalUrlDerived = false,
	internalProtocolObserved = false,
	internalRouteMismatch = false,
	internalTargetSource = "none",
}: Props) {
	const t = useTranslations("homelab");
  const french = useLocale() === "fr";
	const hasInternal =
		!readOnly && typeof svc.internalHost === "string" && Boolean(svc.internalPort);
	const isExternal = svc.external === true;
	const isPrivateEndpoint = !isExternal && hasInternal;
	const privateExposureDebt =
		serviceId === "garage" &&
		endpointUrlHostIsPrivateS3(svc.tunnelUrl) &&
		isExternal;
	const endpointEnabled = !readOnly && svc.endpointEnabled !== false;
	const initialHealth = !healthUnavailable ? reconciledHealth(
		serviceHealthEvidence(serviceHealth, svc, endpointUrl, snapshot),
		svc,
		snapshot?.schema_version,
	) : undefined;
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
  // Docker RUNNING is not proof of a successful TCP/LAN probe.
  const lanProbe = snapshot ?
    describeServiceProbe(initialHealth, snapshot, "internal") : null;
  const internalState: HomelabHealthState = !lanProbe ||
    ["disabled", "not-configured", "not-run", "stale"].includes(lanProbe.state) ? "unknown" :
    lanProbe.state === "failed" ? "fail" :
    initialHealth?.internal_state ?? "unknown";
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
					: runtimeState === "unknown"
						? t("runtime.unknown")
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
					src={serviceIconPath(homelabServiceIconSrc(serviceId, svc.iconSrc))}
					width={80}
					height={80}
					alt={homelabServiceDisplayName(svc)}
					loading="lazy"
					decoding="async"
					style={{ minHeight: 60, minWidth: 60, height: "auto" }}
				/>
				<div className="card-body text-center border-top border-secondary">
					<div className={styles.serviceTitleRow}>
						<h3 className="h5 card-title mb-0">
							{homelabServiceDisplayName(svc)}
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
          {!readOnly && snapshot && (
            <ServiceOwnerEvidenceSummary entry={initialHealth} snapshot={snapshot} unavailable={healthUnavailable} />
          )}
          {!readOnly && !snapshot && (
            <p className="small text-warning mt-2 mb-1" data-service-evidence-unavailable>
              {t("health.states.unknown")} · {french ? "Docker, TLS, Cloudflare, Prometheus et sondes indisponibles" : "Docker, TLS, Cloudflare, Prometheus and probes unavailable"}
            </p>
          )}
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
							url={readOnly ? "" : endpointUrl}
							enabled={endpointEnabled}
							external={isExternal}
							tunnelSecure={svc.tunnelSecure === true}
							label={t("endpoint.external")}
							initialHealth={initialHealth}
							snapshotCheckedAt={snapshot?.checked_at}
							truenasDown={truenasDown && dependsOnTrueNas}
						/>
            {!readOnly && endpointEnabled && endpointUrl && (
              <small className="text-break text-start" data-owner-external-target>
                {endpointUrl}
                {externalUrlDerived ? (french ? " · URL dérivée, à vérifier" : " · derived URL, verify before use") : ""}
              </small>
            )}
            {hasInternal && internalTargetSource === "declared" && (
              <small className="text-start" data-owner-lan-declared>
                {french ? "Adresse/port issus de la configuration · aucune sonde LAN" : "Address/port from configuration · no LAN probe"}
              </small>
            )}
            {hasInternal && internalRouteMismatch && (
              <small className="text-warning text-start" data-owner-lan-route-mismatch>
                {french ? "Écart détecté : origine Cloudflare différente de la cible déclarée" : "Route drift: Cloudflare origin differs from declared target"}
              </small>
            )}
            {hasInternal && !internalProtocolObserved && (
              <small className="text-start text-warning" data-owner-internal-protocol>
                {french ? "Protocole LAN non confirmé · lien HTTP proposé" : "LAN protocol unconfirmed · HTTP link suggested"}
              </small>
            )}
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
                data-lan-probe-state={lanProbe?.state ?? "not-run"}
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
