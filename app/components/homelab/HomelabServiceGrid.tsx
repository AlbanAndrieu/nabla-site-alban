"use client";

import { useTranslations } from "next-intl";
import type { HomelabHealthSnapshot } from "@/lib/homelabHealth";
import {
	type HomelabService,
	type HomelabServicesCatalog,
	homelabServiceEndpointUrl,
	homelabServiceId,
} from "@/lib/homelabServices";
import HomelabServiceCard from "./HomelabServiceCard";
import HomelabServiceGridLegends from "./HomelabServiceGridLegends";
import { healthIndex } from "./homelabGridPresentation";

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
					const endpointUrl = homelabServiceEndpointUrl(svc);
					return (
						<HomelabServiceCard
							key={`${serviceId}:${endpointUrl}`}
							svc={svc}
							serviceId={serviceId}
							endpointUrl={endpointUrl}
							anchorId={
								services.findIndex(
									(item) => homelabServiceId(item) === serviceId,
								) === serviceIndex
									? `homelab-service-${serviceId}`
									: undefined
							}
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
