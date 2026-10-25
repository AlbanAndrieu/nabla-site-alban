"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import CriticalDependencyHierarchy from "@/app/components/homelab/CriticalDependencyHierarchy";
import homelabStyles from "@/app/components/homelab/HomelabServicesBlock.module.css";
import type { HomelabServicesCatalog } from "@/lib/homelabServices";
import { analyzeServicePresentation } from "@/lib/servicePresentation";
import type {
	ServiceTopology,
	ServiceTopologySource,
} from "@/lib/serviceTopology";
import ArchitectureHealthDashboard from "./ArchitectureHealthDashboard";
import ArchitectureServiceHierarchy from "./ArchitectureServiceHierarchy";
import styles from "./ArchitectureTopologyView.module.css";
import {
	countHealthStates,
	filterArchitectureCatalog,
	type GroupFilter,
	type HealthFilter,
	indexHealth,
} from "./architectureTopologyFilters";
// Defer heavy ReactFlow chunks until they are about to be visible.
const HierarchicalArchitectureExplorer = dynamic(() => import("./HierarchicalArchitectureExplorer"), { ssr: false });
const C4ArchitectureView = dynamic(() => import("./C4ArchitectureView"), { ssr: false });

function useGraphNearViewport<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (ready || !ref.current) return;
    if (typeof IntersectionObserver === "undefined") { setReady(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) { setReady(true); observer.disconnect(); }
    }, { rootMargin: "420px" });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ready]);
  return { ref, ready };
}

import MobileArchitectureHierarchy from "./MobileArchitectureHierarchy";
import useArchitectureHealthPolling from "./useArchitectureHealthPolling";
import useArchitectureLiveData from "./useArchitectureLiveData";

const NO_HEALTH_INDEX = indexHealth(null);

type Props = {
	locale: string;
	initialCatalog: HomelabServicesCatalog;
	initialCatalogSource: string;
	initialTopology: ServiceTopology;
	initialTopologySource: ServiceTopologySource;
	readOnly?: boolean;
};

export default function ArchitectureTopologyView({
	locale,
	initialCatalog,
	initialCatalogSource,
	initialTopology,
	initialTopologySource,
	readOnly = false,
}: Readonly<Props>) {
	const french = locale === "fr";
	const { catalog, catalogSource, topology, topologySource } =
		useArchitectureLiveData({
			initialCatalog,
			initialCatalogSource,
			initialTopology,
			initialTopologySource,
		});
	const { health, siteHealth, healthUnavailable, refreshing, healthSource } =
		useArchitectureHealthPolling(readOnly);
	const [healthFilter, setHealthFilter] = useState<HealthFilter>("all");
	const [groupFilter, setGroupFilter] = useState<GroupFilter>("all");
	const [searchQuery, setSearchQuery] = useState("");
	const c4Viewport = useGraphNearViewport<HTMLDivElement>();
	const explorerViewport = useGraphNearViewport<HTMLElement>();

	const healthIndex = useMemo(
		() => indexHealth(health, siteHealth, catalog.catalogRevision),
		[health, siteHealth, catalog.catalogRevision],
	);
	const presentation = useMemo(
		() => analyzeServicePresentation(catalog, topology),
		[catalog, topology],
	);
	const counts = useMemo(
		() => countHealthStates(catalog.services, healthIndex),
		[catalog.services, healthIndex],
	);

	// Health only changes the filtered set under a health filter; otherwise keep
	// the graph input referentially stable across polls.
	const filterHealthIndex =
		healthFilter === "all" ? NO_HEALTH_INDEX : healthIndex;
	const filteredCatalog = useMemo<HomelabServicesCatalog>(
		() =>
			filterArchitectureCatalog(catalog, {
				healthIndex: filterHealthIndex,
				presentation,
				healthFilter,
				groupFilter,
				searchQuery,
			}),
		[
			catalog,
			filterHealthIndex,
			groupFilter,
			healthFilter,
			presentation,
			searchQuery,
		],
	);

	return (
		<>
			<div className="container">
				<section
					id="architecture-health-dashboard"
					className={homelabStyles.healthDashboard}
					aria-labelledby="architecture-health-dashboard-title"
				>
					<ArchitectureHealthDashboard
						french={french}
						refreshing={refreshing}
						healthUnavailable={healthUnavailable}
						healthSource={healthSource}
						checkedAt={health?.checked_at}
						counts={counts}
						healthFilter={healthFilter}
						setHealthFilter={setHealthFilter}
						groupFilter={groupFilter}
						setGroupFilter={setGroupFilter}
						searchQuery={searchQuery}
						setSearchQuery={setSearchQuery}
						shownCount={filteredCatalog.services.length}
						totalCount={catalog.services.length}
					/>
				</section>

				<ArchitectureServiceHierarchy
					catalog={filteredCatalog}
					topology={topology}
					snapshot={health}
					siteHealth={siteHealth}
					healthUnavailable={healthUnavailable}
				/>
			</div>

			<div className={styles.criticalitySection}>
				<CriticalDependencyHierarchy topology={topology} />
			</div>

			<MobileArchitectureHierarchy
				locale={locale}
				catalog={filteredCatalog}
				topology={topology}
				snapshot={health}
				siteHealth={siteHealth}
			/>

			<div id="architecture-c4" ref={c4Viewport.ref} className={styles.explorerSection} aria-busy={!c4Viewport.ready}>
				{c4Viewport.ready
					? <C4ArchitectureView locale={locale} topology={topology} readOnly={readOnly} />
					: <p role="status">{french ? "Diagramme C4 chargé à l’approche de la section" : "C4 diagram loads near the viewport"}</p>}
			</div>

			<section
				ref={explorerViewport.ref}
				aria-busy={!explorerViewport.ready}
				id="service-architecture-explorer"
				className={styles.explorerSection}
				aria-labelledby="service-architecture-explorer-title"
			>
				<div className={styles.sectionHeading}>
					<h2 id="service-architecture-explorer-title">
						{french
							? "Topologie interactive des services"
							: "Interactive service topology"}
					</h2>
					<p>
						{french
							? "Utilisez la recherche et les contrôles du graphe pour basculer entre plateforme IA, services, chemin critique, catalogue complet et relations optionnelles. Sur mobile, la hiérarchie compacte ci-dessus fournit une lecture plus directe avant le graphe complet."
							: "Use the graph search and controls to switch between the AI platform, services, critical path, full catalog, and optional relations. On mobile, the compact hierarchy above provides a more direct view before the complete graph."}
					</p>
				</div>
                {explorerViewport.ready ? (
				<HierarchicalArchitectureExplorer
					locale={locale}
					catalog={filteredCatalog}
					catalogSource={catalogSource}
					topology={topology}
					topologySource={topologySource}
					healthStatus={health}
					healthSource={healthSource}
					readOnly={readOnly}
				/>
                ) : <p role="status">{french ? "Topologie chargée à l’approche de la section" : "Topology loads near the viewport"}</p>}
			</section>
		</>
	);
}
