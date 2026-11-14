"use client";

import { useMemo } from "react";
import { catalogEntitySlug } from "@/lib/homelabCatalogV2Names";
import type { HomelabHealthSnapshot, HomelabHealthState } from "@/lib/homelabHealth";
import {
	indexOwnerNavigation,
	observedOwnerServiceNavigation,
	type OwnerNavigationIndex,
} from "@/lib/homelabOwnerServiceNavigation";
import type { ResourceSnapshot } from "@/lib/homelabResourceEvidence";
import {
	type HomelabService,
	type HomelabServicesCatalog,
	homelabServiceId,
} from "@/lib/homelabServices";
import { type SiteHealthV2, siteHealthIndex } from "@/lib/siteHealthV2";
import HomelabServiceCard from "./HomelabServiceCard";
import HomelabServiceGridLegends from "./HomelabServiceGridLegends";
import { healthIndex, type ServiceEvidenceIndex } from "./homelabGridPresentation";

type Props = {
	catalog: HomelabServicesCatalog;
	snapshot: HomelabHealthSnapshot | null;
	ownerNavigationIndex?: OwnerNavigationIndex | null;
	ownerHealthIndex?: ServiceEvidenceIndex | null;
	siteStatusIndex?: Map<string, HomelabHealthState> | null;
	siteHealth?: SiteHealthV2 | null;
	healthUnavailable?: boolean;
	ownerBoundary?: boolean;
	resources?: ResourceSnapshot | null;
	resourceStale?: boolean;
	readOnly?: boolean;
};

export default function HomelabServiceGrid({
	catalog,
	snapshot: rawSnapshot,
	ownerNavigationIndex = null,
	ownerHealthIndex = null,
	siteStatusIndex = null,
	siteHealth = null,
	healthUnavailable = false,
	ownerBoundary = false,
	resources = null,
	resourceStale = true,
	readOnly = false,
}: Props) {
	// Enforce the OWNER boundary even if an upstream caller accidentally passes
	// a private snapshot into the public directory.
	const snapshot = readOnly || ownerBoundary ? null : rawSnapshot;
	// Show UI and APIs separately; public hostname routing is audited independently.
	const services: HomelabService[] = catalog.services;
	const resourceIndex = useMemo(
		() => new Map((readOnly || ownerBoundary ? [] : resources?.services ?? []).map((row) => [row.entityRef, row] as const)),
		[readOnly, ownerBoundary, resources],
	);
	// Keep React identity stable across health/URL refreshes. Changing the URL
	// must not remount cards or reset their open diagnostics panels.
	const serviceOccurrences = new Map<string, number>();
	const serviceHealth = useMemo(
		() => (snapshot ? (ownerHealthIndex ?? healthIndex(snapshot)) : healthIndex(null)),
		[snapshot, ownerHealthIndex],
	);
	const safeStatus = useMemo(
		() =>
			siteStatusIndex &&
			siteHealth?.boardState === "fresh" &&
			siteHealth.catalogRevision === catalog.catalogRevision
				? siteStatusIndex
				: siteHealthIndex(siteHealth, catalog.catalogRevision),
		[siteStatusIndex, siteHealth, catalog.catalogRevision],
	);
	const navigationIndex = useMemo(
		() =>
			!snapshot || healthUnavailable
				? null
				: (ownerNavigationIndex ?? indexOwnerNavigation(snapshot)),
		[snapshot, healthUnavailable, ownerNavigationIndex],
	);
	const truenasPublic = snapshot?.truenas?.public;
	const truenasApi = snapshot?.truenas?.api;
	const truenasPublicUp =
		truenasPublic?.reachable === true && truenasPublic.state !== "fail";
	const truenasDown = !truenasPublicUp && snapshot?.truenas?.state === "fail";
	const truenasRuntimeUnavailable =
		healthUnavailable ||
		truenasApi?.reachable === false ||
		snapshot?.truenas_runtime_reachable === false;
	const truenasRuntimeStale = snapshot?.truenas_runtime_stale === true;

	return (
		<>
			<div className="row service-grid">
				{services.map((svc) => {
					// Cards, anchors and icons keep the entity name slug as presentation key.
					const serviceId = catalogEntitySlug(homelabServiceId(svc));
					const observed = observedOwnerServiceNavigation(
						svc,
						readOnly || healthUnavailable ? null : snapshot,
						navigationIndex ?? undefined,
					);
					const displayService = observed.service;
					// Backstage v2 has no publicly navigable endpoint: only verified OWNER
					// FastAPI exposure can authorize a card link.
					const endpointUrl =
						!readOnly && !healthUnavailable ? observed.externalUrl : "";
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
							resource={
								!readOnly && !ownerBoundary && svc.entityRef
									? resourceIndex.get(svc.entityRef)
									: undefined
							}
							resourceStale={resourceStale}
							externalUrlDerived={observed.externalUrlDerived}
							internalProtocolObserved={observed.internalProtocolObserved}
							internalRouteMismatch={observed.internalRouteMismatch}
							anchorId={
								firstOccurrence ? `homelab-service-${serviceId}` : undefined
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
