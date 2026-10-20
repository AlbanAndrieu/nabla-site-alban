"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import useHomelabAccess from "@/app/components/homelab/useHomelabAccess";
import SectionHeading from "@/components/SectionHeading";
import {
	getStaticHomelabServicesCatalog,
	type HomelabServicesCatalog,
	parseHomelabServicesCatalog,
} from "@/lib/homelabServices";
import {
	getStaticServiceTopology,
	parseServiceTopology,
	type ServiceTopology,
} from "@/lib/serviceTopology";
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
 * Loads the private catalog and topology from the gated routes. The public
 * JSON placeholders only keep the views renderable when a route fails.
 */
function usePrivateArchitectureData(enabled: boolean) {
	const [data, setData] = useState<PrivateArchitectureData | null>(null);

	useEffect(() => {
		if (!enabled) return;
		const controller = new AbortController();
		const fallbackCatalog = getStaticHomelabServicesCatalog();
		Promise.allSettled([
			fetchJson("/api/homelab-services", controller.signal),
			fetchJson("/api/homelab-topology", controller.signal),
		]).then(([catalogResult, topologyResult]) => {
			if (controller.signal.aborted) return;
			const catalog =
				catalogResult.status === "fulfilled"
					? parseHomelabServicesCatalog(catalogResult.value.body)
					: null;
			const topology =
				topologyResult.status === "fulfilled"
					? parseServiceTopology(topologyResult.value.body)
					: null;
			setData({
				catalog: catalog ?? fallbackCatalog.catalog,
				catalogSource:
					catalog && catalogResult.status === "fulfilled"
						? (catalogResult.value.response.headers.get(
								"X-Homelab-Services-Source",
							) ?? "fastapi")
						: fallbackCatalog.source,
				topology: topology ?? getStaticServiceTopology().topology,
				topologyLive: topology !== null,
			});
		});
		return () => controller.abort();
	}, [enabled]);

	return data;
}

/** Owner-only architecture explorer, impact inspector and network flow. */
export default function ArchitecturePrivateViews({
	locale,
}: Readonly<{ locale: string }>) {
	const trusted = useHomelabAccess() === "trusted";
	const data = usePrivateArchitectureData(trusted);
	if (!trusted || !data) return null;
	const french = locale === "fr";

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
