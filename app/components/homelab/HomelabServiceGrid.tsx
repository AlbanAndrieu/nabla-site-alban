"use client";

import { useTranslations } from "next-intl";
import type { HomelabHealthSnapshot } from "@/lib/homelabHealth";
import {
	type HomelabService,
	type HomelabServicesCatalog,
	homelabServiceId,
} from "@/lib/homelabServices";
import { type SiteHealthV2, siteHealthIndex } from "@/lib/siteHealthV2";
import { observedOwnerServiceNavigation } from "@/lib/homelabOwnerServiceNavigation";
import HomelabServiceCard from "./HomelabServiceCard";
import HomelabServiceGridLegends from "./HomelabServiceGridLegends";
import { healthIndex } from "./homelabGridPresentation";

type Props = {
	catalog: HomelabServicesCatalog;
	snapshot: HomelabHealthSnapshot | null;
	siteHealth?: SiteHealthV2 | null;
	healthUnavailable?: boolean;
	healthHttpStatus?: number | null;
	ownerBoundary?: boolean;
  readOnly?: boolean;
};

export default function HomelabServiceGrid({
	catalog,
	snapshot,
	siteHealth = null,
	healthUnavailable = false,
	healthHttpStatus = null,
	ownerBoundary = false,
  readOnly = false,
}: Props) {
	const t = useTranslations("homelab");
	// Show UI and APIs separately; public hostname routing is audited independently.
	const services: HomelabService[] = catalog.services;
	// Keep React identity stable across health/URL refreshes. Changing the URL
	// must not remount cards or reset their open diagnostics panels.
	const serviceOccurrences = new Map<string, number>();
	const serviceHealth = healthIndex(snapshot);
	const safeStatus = siteHealthIndex(siteHealth, catalog.catalogRevision);
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
			ownerBoundary
				? t("truenas.ownerBoundary")
				: t("truenas.liveSnapshotUnavailable", {
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
				{services.map((svc) => {
					const serviceId = homelabServiceId(svc);
					const observed = observedOwnerServiceNavigation(svc, readOnly || healthUnavailable ? null : snapshot);
					const displayService = observed.service;
					// Backstage v2 has no publicly navigable endpoint: only verified OWNER
                    // FastAPI exposure can authorize a card link.
                    const endpointUrl = !readOnly && !healthUnavailable ? observed.externalUrl : "";
					const occurrence = (serviceOccurrences.get(serviceId) ?? 0) + 1;
					serviceOccurrences.set(serviceId, occurrence);
					const firstOccurrence = occurrence === 1;
					return (
						<HomelabServiceCard
							key={`${serviceId}:${occurrence}`}
							svc={displayService}
							siteState={
								typeof svc.entityRef === "string"
									? safeStatus.get(svc.entityRef)
									: undefined
							}
							serviceId={serviceId}
							endpointUrl={endpointUrl}
							readOnly={readOnly}
							externalUrlDerived={observed.externalUrlDerived}
							internalProtocolObserved={observed.internalProtocolObserved}
							internalRouteMismatch={observed.internalRouteMismatch}
							anchorId={firstOccurrence ? `homelab-service-${serviceId}` : undefined}
							snapshot={snapshot}
							serviceHealth={serviceHealth}
							healthUnavailable={healthUnavailable}
							truenasDown={truenasDown}
							truenasRuntimeUnavailable={truenasRuntimeUnavailable}
							truenasRuntimeStale={truenasRuntimeStale}
						/>
					);
				})}
			</div>

			<HomelabServiceGridLegends />
		</>
	);
}
