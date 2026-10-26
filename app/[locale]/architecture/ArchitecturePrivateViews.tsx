"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import useHomelabAccess from "@/app/components/homelab/useHomelabAccess";
import useAuthorizedLayoutHold from "@/app/components/homelab/useAuthorizedLayoutHold";
import SectionHeading from "@/components/SectionHeading";
import { parseHomelabCatalogV2 } from "@/lib/homelabCatalogV2";
import { catalogFailureReason, catalogScopeMatches, classifyCatalogFailure, type CatalogFailureReason, type CatalogScope } from "@/lib/homelabClientAccessBoundary";
import { parseOwnerCatalogIncident, type OwnerCatalogIncident } from "@/lib/homelabCatalogFailureStage";
import { projectHomelabCatalogV2 } from "@/lib/homelabCatalogV2Projection";
import type { HomelabServicesCatalog } from "@/lib/homelabServices";
import type { ServiceTopology } from "@/lib/serviceTopology";
import ArchitectureCatalogNotice from "./ArchitectureCatalogNotice";
import noticeStyles from "./ArchitectureCatalogNotice.module.css";
import ArchitectureSectionNav from "./ArchitectureSectionNav";

// Loaded only after the server confirmed owner access, so anonymous visitors
// never download nor render the operational views.
const HomelabOperationalEvidence = dynamic(
	() => import("@/app/components/homelab/HomelabOperationalEvidence"),
	{ ssr: false },
);
const ArchitectureImpactInspector = dynamic(
	() => import("./ArchitectureImpactInspector"),
	{ ssr: false },
);
const ArchitectureTopologyView = dynamic(
	() => import("./ArchitectureTopologyView"),
	{ ssr: false },
);
const HomeLabNetworkFlow = dynamic(
	() => import("@/app/components/truenas/HomeLabNetworkFlow"),
	{ ssr: false },
);

type PrivateArchitectureData = {
	catalog: HomelabServicesCatalog;
	catalogSource: string;
	topology: ServiceTopology;
	topologyLive: boolean;
};

type CatalogRequestState =
	| { status: "loading"; data: null; reason: null; incident: null; scope: null }
	| { status: "error"; data: null; reason: CatalogFailureReason; incident: OwnerCatalogIncident | null; scope: CatalogScope }
	| { status: "ready"; data: PrivateArchitectureData; reason: null; incident: null; scope: CatalogScope };

class CatalogRequestError extends Error {
	constructor(readonly reason: CatalogFailureReason, readonly incident: OwnerCatalogIncident | null = null) {
		super("Private Backstage v2 catalog request failed");
	}
}

/** Compatibility export: both pages now use the same public-safe reason classifier. */
export { catalogFailureReason };

async function fetchJson(url: string, signal: AbortSignal, ownerAuthorized: boolean): Promise<unknown> {
	const response = await fetch(url, {
		cache: "no-store",
		signal,
		headers: { Accept: "application/json" },
	});
	if (!response.ok) {
		const body: unknown = await response.json().catch(() => null);
		const policy = classifyCatalogFailure(response.status, body);
		const incident = ownerAuthorized
			? parseOwnerCatalogIncident(
					response.headers.get("X-Nabla-Diagnostic-Stage"),
					response.headers.get("X-Nabla-Request-ID"),
				)
			: null;
		throw new CatalogRequestError(policy.reason, incident);
	}
	return response.json();
}

/**
 * Single owner-gated canonical v2 request for service cards and topology.
 * Retry the catalog alone; do not reload the page or fall back to public v1.
 */
function usePrivateArchitectureData(enabled: boolean, ownerAuthorized: boolean) {
	const [request, setRequest] = useState<CatalogRequestState>({
		status: "loading",
		data: null,
		reason: null,
		incident: null,
		scope: null,
	});
	const [attempt, setAttempt] = useState(0);

	useEffect(() => {
		if (!enabled) return;
		const controller = new AbortController();
		void fetchJson("/api/homelab-catalog-v2", controller.signal, ownerAuthorized)
			.then((body) => {
				if (controller.signal.aborted) return;
				const catalog = parseHomelabCatalogV2(body);
				if (!catalog || catalog.entities.length === 0) {
					throw new CatalogRequestError("unavailable");
				}
				const projected = projectHomelabCatalogV2(catalog);
				setRequest({
					status: "ready",
					data: {
						catalog: projected.services,
						catalogSource: "backstage-v2",
						topology: projected.topology,
						topologyLive: true,
					},
					reason: null,
					incident: null,
					scope: ownerAuthorized ? "owner" : "public",
				});
			})
			.catch((error: unknown) => {
				if (controller.signal.aborted) return;
				setRequest({
					status: "error",
					data: null,
					reason:
						error instanceof CatalogRequestError ? error.reason : "unavailable",
					incident: ownerAuthorized && error instanceof CatalogRequestError ? error.incident : null,
					scope: ownerAuthorized ? "owner" : "public",
				});
			});
		return () => controller.abort();
	}, [enabled, ownerAuthorized, attempt]);

	const retry = () => {
		setRequest({ status: "loading", data: null, reason: null, incident: null, scope: null });
		setAttempt((current) => current + 1);
	};
	// Effects run after render. Hide any OWNER data synchronously when access
	// changes to public, including on a Wi-Fi/VPN or identity transition.
	if (!catalogScopeMatches(request.scope, !ownerAuthorized)) {
		return { status: "loading" as const, data: null, reason: null, incident: null, retry };
	}
	return { ...request, retry };
}

/** Owner-only architecture explorer, impact inspector and network flow. */
export default function ArchitecturePrivateViews({
	locale,
}: Readonly<{ locale: string }>) {
	const access = useHomelabAccess();
	const visible = access === "trusted" || access === "readonly";
	const { data, status, reason, incident, retry } = usePrivateArchitectureData(
		visible, access === "trusted",
	);
	// The region is only in the DOM after the catalog has resolved.
	const { regionRef, reservedHeight } = useAuthorizedLayoutHold(
		visible && status === "ready",
	);
	if (!visible) {
		return access === "pending"
			? <div data-homelab-access-rechecking aria-hidden="true"
				style={{ minHeight: reservedHeight }} />
			: null;
	}
	const french = locale === "fr";
	if (status === "error")
		return (
			<ArchitectureCatalogNotice
				french={french}
				reason={reason}
				incident={access === "trusted" ? incident : null}
				onRetry={retry}
			/>
		);
	if (status === "loading" || !data)
		return (
			<div className="container py-4" role="status" aria-live="polite">
				<p className={noticeStyles.loading}>
					{french
						? "Chargement de la cartographie privée des services…"
						: "Loading the private service architecture…"}
				</p>
			</div>
		);

	if (access === "readonly")
		return (
			<div ref={regionRef} data-homelab-access-region>
				<div data-homelab-public-readonly-view className="container py-4">
				<ArchitectureTopologyView
					readOnly
					locale={locale}
					initialCatalog={data.catalog}
					initialCatalogSource={data.catalogSource}
					initialTopology={data.topology}
					initialTopologySource="fastapi"
				/>
				</div>
			</div>
		);
	return (
		<div ref={regionRef} data-homelab-access-region>
		<div data-homelab-private-view>
			<ArchitectureSectionNav locale={locale} />
			<div className="container">
				<HomelabOperationalEvidence />
			</div>
			<ArchitectureImpactInspector
				locale={locale}
				initialTopology={data.topology}
			/>
			<ArchitectureTopologyView
				locale={locale}
				initialCatalog={data.catalog}
				initialCatalogSource={data.catalogSource}
				initialTopology={data.topology}
				initialTopologySource={data.topologyLive ? "fastapi" : "local-fallback"}
			/>
			<section
				id="homelab-network-architecture"
				className="content-section"
				aria-labelledby="homelab-network-ingress-paths"
			>
				<div className="container py-5">
					<div className="mx-auto mb-4" style={{ maxWidth: "900px" }}>
						<SectionHeading
							id="homelab-network-ingress-paths"
							iconClass="fa-network-wired"
						>
							{french
								? "Réseau homelab et chemins d’ingress"
								: "Homelab network and ingress paths"}
						</SectionHeading>
					</div>
					<HomeLabNetworkFlow />
				</div>
			</section>
		</div>
		</div>
	);
}
