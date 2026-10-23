"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import useHomelabAccess from "@/app/components/homelab/useHomelabAccess";
import SectionHeading from "@/components/SectionHeading";
import { parseHomelabCatalogV2 } from "@/lib/homelabCatalogV2";
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

type CatalogFailureReason = "key-missing" | "access-denied" | "unavailable";
type CatalogRequestState =
	| { status: "loading"; data: null; reason: null }
	| { status: "error"; data: null; reason: CatalogFailureReason }
	| { status: "ready"; data: PrivateArchitectureData; reason: null };

class CatalogRequestError extends Error {
	constructor(readonly reason: CatalogFailureReason) {
		super("Private Backstage v2 catalog request failed");
	}
}

/** Only accept server-sanitized reasons; never render raw upstream errors. */
export function catalogFailureReason(value: unknown): CatalogFailureReason {
	if (
		typeof value === "object" &&
		value !== null &&
		"reason" in value &&
		(value.reason === "key-missing" || value.reason === "access-denied")
	) {
		return value.reason;
	}
	return "unavailable";
}

async function fetchJson(url: string, signal: AbortSignal): Promise<unknown> {
	const response = await fetch(url, {
		cache: "no-store",
		signal,
		headers: { Accept: "application/json" },
	});
	if (!response.ok) {
		const body: unknown = await response.json().catch(() => null);
		throw new CatalogRequestError(catalogFailureReason(body));
	}
	return response.json();
}

/**
 * Single owner-gated canonical v2 request for service cards and topology.
 * Retry the catalog alone; do not reload the page or fall back to public v1.
 */
function usePrivateArchitectureData(enabled: boolean) {
	const [request, setRequest] = useState<CatalogRequestState>({
		status: "loading",
		data: null,
		reason: null,
	});
	const [attempt, setAttempt] = useState(0);

	useEffect(() => {
		if (!enabled) return;
		const controller = new AbortController();
		void fetchJson("/api/homelab-catalog-v2", controller.signal)
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
				});
			})
			.catch((error: unknown) => {
				if (controller.signal.aborted) return;
				setRequest({
					status: "error",
					data: null,
					reason:
						error instanceof CatalogRequestError ? error.reason : "unavailable",
				});
			});
		return () => controller.abort();
	}, [enabled, attempt]);

	const retry = () => {
		setRequest({ status: "loading", data: null, reason: null });
		setAttempt((current) => current + 1);
	};
	return { ...request, retry };
}

/** Owner-only architecture explorer, impact inspector and network flow. */
export default function ArchitecturePrivateViews({
	locale,
}: Readonly<{ locale: string }>) {
	const access = useHomelabAccess();
	const visible = access === "trusted" || access === "readonly";
	const { data, status, reason, retry } = usePrivateArchitectureData(visible);
	if (!visible) return null;
	const french = locale === "fr";
	if (status === "error")
		return (
			<ArchitectureCatalogNotice
				french={french}
				reason={reason}
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
			<div data-homelab-public-readonly-view className="container py-4">
				<p role="status">
					{french
						? "Cartographie publiée en lecture seule ; les diagnostics réseau internes restent privés."
						: "Published read-only architecture; private network diagnostics remain restricted."}
				</p>
				<ArchitectureTopologyView
					readOnly
					locale={locale}
					initialCatalog={data.catalog}
					initialCatalogSource={data.catalogSource}
					initialTopology={data.topology}
					initialTopologySource="fastapi"
				/>
			</div>
		);
	return (
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
						<p>
							{french
								? "Même diagramme que la page TrueNAS : ingress direct HAProxy/Traefik, Cloudflare Tunnel, DNS scindé et domaines de panne."
								: "Same diagram as the TrueNAS page: direct HAProxy/Traefik ingress, Cloudflare Tunnel, split DNS and failure domains."}
						</p>
					</div>
					<HomeLabNetworkFlow />
				</div>
			</section>
		</div>
	);
}
