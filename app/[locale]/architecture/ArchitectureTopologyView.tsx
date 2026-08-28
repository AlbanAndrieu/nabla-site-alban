"use client";

import { useEffect, useState } from "react";
import ServiceCriticalityOverview from "@/app/components/homelab/ServiceCriticalityOverview";
import {
	parseHomelabServicesCatalog,
	type HomelabServicesCatalog,
} from "@/lib/homelabServices";
import {
	parseServiceTopology,
	type ServiceTopology,
	type ServiceTopologySource,
} from "@/lib/serviceTopology";
import ArchitectureExplorer from "./ArchitectureExplorer";

type Props = {
	locale: string;
	initialCatalog: HomelabServicesCatalog;
	initialCatalogSource: string;
	initialTopology: ServiceTopology;
	initialTopologySource: ServiceTopologySource;
};

export default function ArchitectureTopologyView({
	locale,
	initialCatalog,
	initialCatalogSource,
	initialTopology,
	initialTopologySource,
}: Readonly<Props>) {
	const [catalog, setCatalog] = useState(initialCatalog);
	const [catalogSource, setCatalogSource] = useState(initialCatalogSource);
	const [topology, setTopology] = useState(initialTopology);
	const [topologySource, setTopologySource] =
		useState<ServiceTopologySource>(initialTopologySource);

	useEffect(() => {
		const controller = new AbortController();

		const loadCatalog = async () => {
			const response = await fetch("/api/homelab-services", {
				cache: "no-store",
				signal: controller.signal,
				headers: { Accept: "application/json" },
			});
			if (!response.ok) throw new Error(`catalog HTTP ${response.status}`);
			const parsed = parseHomelabServicesCatalog(await response.json());
			if (!parsed) throw new Error("invalid catalog");
			setCatalog(parsed);
			setCatalogSource(
				response.headers.get("X-Homelab-Services-Source") ?? "fastapi",
			);
		};

		const loadTopology = async () => {
			const response = await fetch("/api/homelab-topology", {
				cache: "no-store",
				signal: controller.signal,
				headers: { Accept: "application/json" },
			});
			if (!response.ok) throw new Error(`topology HTTP ${response.status}`);
			const parsed = parseServiceTopology(await response.json());
			if (!parsed) throw new Error("invalid topology");
			setTopology(parsed);
			setTopologySource(
				response.headers.get("X-Homelab-Topology-Source") === "local-fallback"
					? "local-fallback"
					: "fastapi",
			);
		};

		void Promise.allSettled([loadCatalog(), loadTopology()]);
		return () => controller.abort();
	}, []);

	return (
		<>
			<ServiceCriticalityOverview topology={topology} />
			<ArchitectureExplorer
				locale={locale}
				catalog={catalog}
				catalogSource={catalogSource}
				topology={topology}
				topologySource={topologySource}
			/>
		</>
	);
}
