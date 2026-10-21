"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import useHomelabAccess from "@/app/components/homelab/useHomelabAccess";
import SectionHeading from "@/components/SectionHeading";
import { parseHomelabCatalogV2 } from "@/lib/homelabCatalogV2";
import { projectHomelabCatalogV2 } from "@/lib/homelabCatalogV2Projection";
import type { HomelabServicesCatalog } from "@/lib/homelabServices";
import type { ServiceTopology } from "@/lib/serviceTopology";
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

async function fetchJson(url: string, signal: AbortSignal) {
	const response = await fetch(url, {
		cache: "no-store",
		signal,
		headers: { Accept: "application/json" },
	});
	if (!response.ok) throw new Error(`${url} HTTP ${response.status}`);
	return { body: (await response.json()) as unknown, response };
}

/**
 * A single owner-gated canonical v2 request feeds both the service cards and
 * graph. Never bootstrap these views from public v1 JSON placeholders.
 */
function usePrivateArchitectureData(enabled: boolean) {
	const [data, setData] = useState<PrivateArchitectureData | null>(null);
	const [unavailable, setUnavailable] = useState(false);

	useEffect(() => {
		if (!enabled) return;
		const controller = new AbortController();
		void fetchJson("/api/homelab-catalog-v2", controller.signal)
			.then(({ body }) => {
				if (controller.signal.aborted) return;
				const catalog = parseHomelabCatalogV2(body);
				if (!catalog || catalog.entities.length === 0) {
					setUnavailable(true);
					return;
				}
				const projected = projectHomelabCatalogV2(catalog);
				setData({
					catalog: projected.services,
					catalogSource: "backstage-v2",
					topology: projected.topology,
					topologyLive: true,
				});
			})
			.catch(() => {
				if (!controller.signal.aborted) setUnavailable(true);
			});
		return () => controller.abort();
	}, [enabled]);

	return { data, unavailable };
}

/** Owner-only architecture explorer, impact inspector and network flow. */
export default function ArchitecturePrivateViews({
	locale,
}: Readonly<{ locale: string }>) {
	const trusted = useHomelabAccess() === "trusted";
	const { data, unavailable } = usePrivateArchitectureData(trusted);
	if (!trusted) return null;
	const french = locale === "fr";
	if (unavailable)
		return (
			<div role="alert" data-architecture-catalog-v2-unavailable>
				{french
					? "Catalogue Backstage v2 indisponible (authentification ou source)."
					: "Backstage v2 catalog unavailable (authorization or source)."}
			</div>
		);
	if (!data) return null;

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
