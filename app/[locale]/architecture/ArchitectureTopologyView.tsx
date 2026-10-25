"use client";

import { useMemo, useState } from "react";
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
import HierarchicalArchitectureExplorer from "./HierarchicalArchitectureExplorer";
import C4ArchitectureView from "./C4ArchitectureView";
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

			<div className={styles.explorerSection}>
				<C4ArchitectureView locale={locale} topology={topology} readOnly={readOnly} />
			</div>

			<section
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
			</section>
		</>
	);
}
