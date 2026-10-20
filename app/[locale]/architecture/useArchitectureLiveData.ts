"use client";

import { useEffect, useState } from "react";
import { parseHomelabCatalogV2 } from "@/lib/homelabCatalogV2";
import { projectHomelabCatalogV2 } from "@/lib/homelabCatalogV2Projection";
import type { HomelabServicesCatalog } from "@/lib/homelabServices";
import type {
	ServiceTopology,
	ServiceTopologySource,
} from "@/lib/serviceTopology";

type InitialArchitectureData = {
	initialCatalog: HomelabServicesCatalog;
	initialCatalogSource: string;
	initialTopology: ServiceTopology;
	initialTopologySource: ServiceTopologySource;
};

/** An initial verified v2 snapshot may be refreshed only by another v2 snapshot. */
export default function useArchitectureLiveData({
	initialCatalog,
	initialCatalogSource,
	initialTopology,
	initialTopologySource,
}: InitialArchitectureData) {
	const [catalog, setCatalog] = useState(initialCatalog);
	const [catalogSource, setCatalogSource] = useState(initialCatalogSource);
	const [topology, setTopology] = useState(initialTopology);
	const [topologySource, setTopologySource] = useState<ServiceTopologySource>(
		initialTopologySource,
	);

	useEffect(() => {
		const controller = new AbortController();
		void fetch("/api/homelab-catalog-v2", {
			cache: "no-store",
			signal: controller.signal,
			headers: { Accept: "application/json" },
		})
			.then(async (response) => {
				if (!response.ok) throw new Error("Backstage v2 refresh unavailable");
				const parsed = parseHomelabCatalogV2(await response.json());
				if (!parsed || parsed.entities.length === 0)
					throw new Error("Invalid Backstage v2 response");
				if (controller.signal.aborted) return;
				const projected = projectHomelabCatalogV2(parsed);
				setCatalog(projected.services);
				setCatalogSource("backstage-v2");
				setTopology(projected.topology);
				setTopologySource("fastapi");
			})
			.catch(() => {
				// The initial snapshot is already a verified v2 response. Never
				// recover by requesting v1 or reading a static fallback.
			});
		return () => controller.abort();
	}, []);

	return { catalog, catalogSource, topology, topologySource };
}
