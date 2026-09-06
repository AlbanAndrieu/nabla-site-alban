"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import CriticalDependencyHierarchy from "@/app/components/homelab/CriticalDependencyHierarchy";
import homelabStyles from "@/app/components/homelab/HomelabServicesBlock.module.css";
import {
	parseHomelabHealthSnapshot,
	type HomelabHealthEntry,
	type HomelabHealthSnapshot,
	type HomelabHealthState,
} from "@/lib/homelabHealth";
import { resolveEffectiveServiceState } from "@/lib/homelabHealthResolver";
import {
	homelabServiceId,
	parseHomelabServicesCatalog,
	type HomelabServicesCatalog,
} from "@/lib/homelabServices";
import {
	analyzeServicePresentation,
	type ServicePresentationGroup,
} from "@/lib/servicePresentation";
import {
	parseServiceTopology,
	type ServiceTopology,
	type ServiceTopologySource,
} from "@/lib/serviceTopology";
import ArchitectureServiceHierarchy from "./ArchitectureServiceHierarchy";
import HierarchicalArchitectureExplorer from "./HierarchicalArchitectureExplorer";
import MobileArchitectureHierarchy from "./MobileArchitectureHierarchy";
import styles from "./ArchitectureTopologyView.module.css";

type Props = {
	locale: string;
	initialCatalog: HomelabServicesCatalog;
	initialCatalogSource: string;
	initialTopology: ServiceTopology;
	initialTopologySource: ServiceTopologySource;
};

type HealthFilter = "all" | HomelabHealthState;
type GroupFilter = "all" | ServicePresentationGroup;

type HealthIndex = {
	byId: Map<string, HomelabHealthEntry>;
	byName: Map<string, HomelabHealthEntry>;
};

const HEALTH_STATES: readonly HomelabHealthState[] = [
	"ok",
	"warn",
	"fail",
	"unknown",
];
const GROUP_FILTERS: readonly GroupFilter[] = [
	"all",
	"services",
	"core-critical",
	"security-controls",
	"shared-core",
	"support",
];

function normalizedName(value: string): string {
	return value.trim().toLowerCase();
}

function indexHealth(snapshot: HomelabHealthSnapshot | null): HealthIndex {
	const byId = new Map<string, HomelabHealthEntry>();
	const byName = new Map<string, HomelabHealthEntry>();
	for (const entry of snapshot?.services ?? []) {
		if (entry.id) byId.set(entry.id, entry);
		byName.set(normalizedName(entry.name), entry);
	}
	return { byId, byName };
}

function effectiveState(
	serviceId: string,
	serviceName: string,
	index: HealthIndex,
): HomelabHealthState {
	const entry =
		index.byId.get(serviceId) ??
		index.byName.get(normalizedName(serviceName));
	return entry ? resolveEffectiveServiceState(entry).effectiveState : "unknown";
}

function snapshotAgeSeconds(
	checkedAt: string | undefined,
	now: number,
): number | null {
	if (!checkedAt) return null;
	const checkedAtMs = Date.parse(checkedAt);
	if (!Number.isFinite(checkedAtMs)) return null;
	return Math.max(0, Math.floor((now - checkedAtMs) / 1000));
}

export default function ArchitectureTopologyView({
	locale,
	initialCatalog,
	initialCatalogSource,
	initialTopology,
	initialTopologySource,
}: Readonly<Props>) {
	const french = locale === "fr";
	const t = useTranslations("homelab");
	const [catalog, setCatalog] = useState(initialCatalog);
	const [catalogSource, setCatalogSource] = useState(initialCatalogSource);
	const [topology, setTopology] = useState(initialTopology);
	const [topologySource, setTopologySource] =
		useState<ServiceTopologySource>(initialTopologySource);
	const [health, setHealth] = useState<HomelabHealthSnapshot | null>(null);
	const [healthUnavailable, setHealthUnavailable] = useState(false);
	const [refreshing, setRefreshing] = useState(true);
	const [healthFilter, setHealthFilter] = useState<HealthFilter>("all");
	const [groupFilter, setGroupFilter] = useState<GroupFilter>("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [now, setNow] = useState(() => Date.now());

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
				response.headers.get("X-Homelab-Topology-Source") ===
					"local-fallback"
					? "local-fallback"
					: "fastapi",
			);
		};

		void Promise.allSettled([loadCatalog(), loadTopology()]);
		return () => controller.abort();
	}, []);

	useEffect(() => {
		let active = true;
		let controller: AbortController | null = null;

		const loadHealth = async () => {
			if (document.hidden) return;
			controller?.abort();
			controller = new AbortController();
			setRefreshing(true);
			try {
				const response = await fetch("/api/homelab-health", {
					cache: "no-store",
					signal: controller.signal,
					headers: { Accept: "application/json" },
				});
				if (!response.ok) {
					throw new Error(`health HTTP ${response.status}`);
				}
				const parsed = parseHomelabHealthSnapshot(await response.json());
				if (!parsed) throw new Error("invalid health payload");
				if (active) {
					setHealth(parsed);
					setHealthUnavailable(false);
					setNow(Date.now());
				}
			} catch (error) {
				if (active && !controller.signal.aborted) {
					setHealthUnavailable(true);
				}
			} finally {
				if (active && !controller.signal.aborted) setRefreshing(false);
			}
		};

		void loadHealth();
		const refreshTimer = window.setInterval(() => void loadHealth(), 30_000);
		const clockTimer = window.setInterval(() => setNow(Date.now()), 5_000);
		const onVisibilityChange = () => {
			if (!document.hidden) void loadHealth();
		};
		document.addEventListener("visibilitychange", onVisibilityChange);
		return () => {
			active = false;
			controller?.abort();
			window.clearInterval(refreshTimer);
			window.clearInterval(clockTimer);
			document.removeEventListener("visibilitychange", onVisibilityChange);
		};
	}, []);

	const healthIndex = useMemo(() => indexHealth(health), [health]);
	const presentation = useMemo(
		() => analyzeServicePresentation(catalog, topology),
		[catalog, topology],
	);
	const counts = useMemo(() => {
		const result: Record<HomelabHealthState, number> = {
			ok: 0,
			warn: 0,
			fail: 0,
			unknown: 0,
		};
		for (const service of catalog.services) {
			const state = effectiveState(
				homelabServiceId(service),
				service.name,
				healthIndex,
			);
			result[state] += 1;
		}
		return result;
	}, [catalog.services, healthIndex]);

	const filteredCatalog = useMemo<HomelabServicesCatalog>(() => {
		const query = searchQuery.trim().toLowerCase();
		const services = catalog.services.filter((service) => {
			const id = homelabServiceId(service);
			const state = effectiveState(id, service.name, healthIndex);
			const group = presentation.get(id)?.group ?? "support";
			const matchesSearch =
				query.length === 0 ||
				service.name.toLowerCase().includes(query) ||
				id.includes(query);
			return (
				(healthFilter === "all" || state === healthFilter) &&
				(groupFilter === "all" || group === groupFilter) &&
				matchesSearch
			);
		});
		return { ...catalog, services };
	}, [
		catalog,
		groupFilter,
		healthFilter,
		healthIndex,
		presentation,
		searchQuery,
	]);

	const ageSeconds = snapshotAgeSeconds(health?.checked_at, now);
	const groupLabel = (group: GroupFilter) =>
		group === "all" ? t("presentation.allGroups") : t(`presentation.groups.${group}`);

	return (
		<>
			<div className="container">
				<section
					id="architecture-health-dashboard"
					className={homelabStyles.healthDashboard}
					aria-labelledby="architecture-health-dashboard-title"
				>
					<div className={homelabStyles.healthDashboardHeader}>
						<div>
							<h2
								id="architecture-health-dashboard-title"
								className={homelabStyles.healthDashboardTitle}
							>
								{french
									? "État et filtres de l’architecture"
									: "Architecture health and filters"}
							</h2>
							<p>
								{french
									? "Les filtres s’appliquent aux services déclarés du graphe ; la topologie complète reste utilisée pour calculer la criticité et le rayon d’impact."
									: "Services stay first; filters use operator presentation roles while the complete topology remains the basis for dependency criticality and blast-radius calculations."}
							</p>
						</div>
						<div
							className={homelabStyles.refreshStatus}
							role="status"
							aria-live="polite"
						>
							{refreshing
								? french
									? "Actualisation…"
									: "Refreshing…"
								: healthUnavailable
									? french
										? "Actualisation indisponible · dernier snapshot conservé"
										: "Refresh unavailable · keeping last snapshot"
									: ageSeconds === null
										? french
											? "Snapshot en attente"
											: "Waiting for snapshot"
										: french
											? `Mis à jour il y a ${ageSeconds}s`
											: `Updated ${ageSeconds}s ago`}
						</div>
					</div>

					<div
						className={homelabStyles.healthSummary}
						aria-label={french ? "Résumé santé" : "Health summary"}
					>
						{HEALTH_STATES.map((state) => (
							<button
								type="button"
								key={state}
								className={homelabStyles.healthChip}
								data-health-filter={state}
								aria-pressed={healthFilter === state}
								onClick={() =>
									setHealthFilter((current) =>
										current === state ? "all" : state,
									)
								}
							>
								<strong>{counts[state]}</strong>{" "}
								{state === "ok"
									? french
										? "sains"
										: "healthy"
									: state === "warn"
										? french
											? "dégradés"
											: "degraded"
										: state === "fail"
											? french
												? "en échec"
												: "failed"
											: french
												? "inconnus"
												: "unknown"}
							</button>
						))}
					</div>

					<div className={homelabStyles.controls}>
						<label className={homelabStyles.filterField}>
							<span className={homelabStyles.filterLabel}>
								{french ? "Santé" : "Health"}
							</span>
							<select
								className={homelabStyles.filterSelect}
								value={healthFilter}
								onChange={(event) =>
									setHealthFilter(event.target.value as HealthFilter)
								}
							>
								<option value="all">
									{french ? "Tous les états" : "All health states"}
								</option>
								<option value="ok">{french ? "Sain" : "Healthy"}</option>
								<option value="warn">
									{french ? "Dégradé" : "Degraded"}
								</option>
								<option value="fail">
									{french ? "En échec" : "Failed"}
								</option>
								<option value="unknown">
									{french ? "Inconnu" : "Unknown"}
								</option>
							</select>
						</label>
						<label className={homelabStyles.filterField}>
							<span className={homelabStyles.filterLabel}>
								{t("presentation.searchLabel")}
							</span>
							<input
								type="search"
								className={homelabStyles.filterSelect}
								value={searchQuery}
								onChange={(event) => setSearchQuery(event.currentTarget.value)}
								placeholder={t("presentation.searchPlaceholder")}
								data-architecture-service-search
							/>
						</label>
						<label className={homelabStyles.filterField}>
							<span className={homelabStyles.filterLabel}>
								{t("presentation.filterLabel")}
							</span>
							<select
								className={homelabStyles.filterSelect}
								value={groupFilter}
								onChange={(event) =>
									setGroupFilter(event.target.value as GroupFilter)
								}
								data-architecture-presentation-filter
							>
								{GROUP_FILTERS.map((group) => (
									<option value={group} key={group}>
										{groupLabel(group)}
									</option>
								))}
							</select>
						</label>
						<div className={homelabStyles.controlButtons}>
							<button
								type="button"
								className={homelabStyles.controlButton}
								onClick={() => {
									setHealthFilter("all");
									setGroupFilter("all");
									setSearchQuery("");
								}}
							>
								{french ? "Réinitialiser" : "Reset filters"}
							</button>
						</div>
					</div>
					<p className={homelabStyles.matchCount}>
						{french
							? `${filteredCatalog.services.length} services déclarés affichés sur ${catalog.services.length}`
							: `${filteredCatalog.services.length} declared services shown of ${catalog.services.length}`}
					</p>
				</section>

				<ArchitectureServiceHierarchy
					catalog={filteredCatalog}
					topology={topology}
					snapshot={health}
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
			/>

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
				/>
			</section>
		</>
	);
}
