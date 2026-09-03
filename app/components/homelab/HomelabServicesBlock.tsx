"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import {
	parseHomelabHealthSnapshot,
	type HomelabHealthEntry,
	type HomelabHealthSnapshot,
	type HomelabHealthState,
} from "@/lib/homelabHealth";
import { resolveEffectiveServiceState } from "@/lib/homelabHealthResolver";
import {
	analyzeServiceCriticality,
	compareServiceCriticality,
	criticalityTierOrder,
	type ServiceCriticalityTier,
} from "@/lib/serviceCriticality";
import {
	homelabServiceId,
	type HomelabService,
	type HomelabServicesCatalog,
} from "@/lib/homelabServices";
import {
	parseServiceTopology,
	type ServiceTopology,
} from "@/lib/serviceTopology";
import CriticalDependencyHierarchy, {
	CRITICAL_DEPENDENCY_HIERARCHY_ID,
} from "./CriticalDependencyHierarchy";
import HomelabServiceGrid from "./HomelabServiceGrid";
import styles from "./HomelabServicesBlock.module.css";
import HomelabStatusOverview from "./HomelabStatusOverview";

const HEALTH_REFRESH_MS = 30_000;
const HEALTH_STATES: readonly HomelabHealthState[] = ["ok", "warn", "fail", "unknown"];
const ALL_TIERS: readonly ServiceCriticalityTier[] = [
	"foundation",
	"shared-data",
	"shared-platform",
	"application",
	"support",
];

type HealthFetchResult = {
	snapshot: HomelabHealthSnapshot | null;
	status: number | null;
};

type State = {
	catalog: HomelabServicesCatalog | null;
	topology: ServiceTopology | null;
	snapshot: HomelabHealthSnapshot | null;
	error: boolean;
	healthUnavailable: boolean;
	healthStatus: number | null;
	healthRefreshing: boolean;
};

type HierarchyGroup = {
	tier: ServiceCriticalityTier;
	catalog: HomelabServicesCatalog;
};

type HealthFilter = "all" | HomelabHealthState;
type TierFilter = "all" | ServiceCriticalityTier;

type TierTitleKey =
	| "criticality.tiers.foundation"
	| "criticality.tiers.shared-data"
	| "criticality.tiers.shared-platform"
	| "criticality.tiers.application"
	| "criticality.tiers.support";

type TierDescriptionKey =
	| "criticality.tierDescriptions.foundation"
	| "criticality.tierDescriptions.shared-data"
	| "criticality.tierDescriptions.shared-platform"
	| "criticality.tierDescriptions.application"
	| "criticality.tierDescriptions.support";

const TIER_TITLE_KEY: Record<ServiceCriticalityTier, TierTitleKey> = {
	foundation: "criticality.tiers.foundation",
	"shared-data": "criticality.tiers.shared-data",
	"shared-platform": "criticality.tiers.shared-platform",
	application: "criticality.tiers.application",
	support: "criticality.tiers.support",
};

const TIER_DESCRIPTION_KEY: Record<ServiceCriticalityTier, TierDescriptionKey> = {
	foundation: "criticality.tierDescriptions.foundation",
	"shared-data": "criticality.tierDescriptions.shared-data",
	"shared-platform": "criticality.tierDescriptions.shared-platform",
	application: "criticality.tierDescriptions.application",
	support: "criticality.tierDescriptions.support",
};

async function fetchCatalog(signal: AbortSignal): Promise<HomelabServicesCatalog> {
	const response = await fetch("/api/homelab-services", { cache: "no-store", signal });
	if (!response.ok) throw new Error(`catalog HTTP ${response.status}`);
	return (await response.json()) as HomelabServicesCatalog;
}

async function fetchTopology(signal: AbortSignal): Promise<ServiceTopology | null> {
	try {
		const response = await fetch("/api/homelab-topology", {
			cache: "no-store",
			signal,
			headers: { Accept: "application/json" },
		});
		if (!response.ok) return null;
		return parseServiceTopology(await response.json());
	} catch (error) {
		if (signal.aborted) throw error;
		return null;
	}
}

async function fetchHealth(signal: AbortSignal): Promise<HealthFetchResult> {
	try {
		const response = await fetch("/api/homelab-health", { cache: "no-store", signal });
		if (!response.ok) return { snapshot: null, status: response.status };
		return {
			snapshot: parseHomelabHealthSnapshot(await response.json()),
			status: response.status,
		};
	} catch (error) {
		if (signal.aborted) throw error;
		return { snapshot: null, status: null };
	}
}

function normalizedName(value: string): string {
	return value.trim().toLowerCase();
}

function healthIndex(snapshot: HomelabHealthSnapshot | null): {
	byId: Map<string, HomelabHealthEntry>;
	byName: Map<string, HomelabHealthEntry>;
} {
	const byId = new Map<string, HomelabHealthEntry>();
	const byName = new Map<string, HomelabHealthEntry>();
	for (const entry of snapshot?.services ?? []) {
		if (entry.id) byId.set(entry.id, entry);
		byName.set(normalizedName(entry.name), entry);
	}
	return { byId, byName };
}

function effectiveState(
	service: HomelabService,
	index: ReturnType<typeof healthIndex>,
): HomelabHealthState {
	const entry =
		index.byId.get(homelabServiceId(service)) ??
		index.byName.get(normalizedName(service.name));
	return entry ? resolveEffectiveServiceState(entry).effectiveState : "unknown";
}

export default function HomelabServicesBlock() {
	const t = useTranslations("homelab");
	const french = useLocale() === "fr";
	const [state, setState] = useState<State>({
		catalog: null,
		topology: null,
		snapshot: null,
		error: false,
		healthUnavailable: false,
		healthStatus: null,
		healthRefreshing: true,
	});
	const [healthFilter, setHealthFilter] = useState<HealthFilter>("all");
	const [tierFilter, setTierFilter] = useState<TierFilter>("all");
	const [expandedTiers, setExpandedTiers] = useState<Set<ServiceCriticalityTier>>(
		() => new Set(ALL_TIERS),
	);
	const [criticalityOpen, setCriticalityOpen] = useState(false);

	useEffect(() => {
		const initialController = new AbortController();
		let refreshController: AbortController | null = null;

		const refreshHealth = async () => {
			if (document.hidden) return;
			refreshController?.abort();
			refreshController = new AbortController();
			setState((current) => ({ ...current, healthRefreshing: true }));
			const health = await fetchHealth(refreshController.signal);
			if (!refreshController.signal.aborted) {
				setState((current) => ({
					...current,
					snapshot: health.snapshot ?? current.snapshot,
					healthUnavailable: health.snapshot === null,
					healthStatus: health.status,
					healthRefreshing: false,
					error: current.catalog === null && health.snapshot === null,
				}));
			}
		};

		void Promise.all([
			fetchCatalog(initialController.signal),
			fetchTopology(initialController.signal),
			fetchHealth(initialController.signal),
		])
			.then(([catalog, topology, health]) => {
				if (!initialController.signal.aborted) {
					setState({
						catalog,
						topology,
						snapshot: health.snapshot,
						error: false,
						healthUnavailable: health.snapshot === null,
						healthStatus: health.status,
						healthRefreshing: false,
					});
				}
			})
			.catch(() => {
				if (!initialController.signal.aborted) {
					setState((current) => ({
						...current,
						error: true,
						healthUnavailable: true,
						healthRefreshing: false,
					}));
				}
			});

		const interval = window.setInterval(() => void refreshHealth(), HEALTH_REFRESH_MS);
		const onVisibilityChange = () => {
			if (!document.hidden) void refreshHealth();
		};
		document.addEventListener("visibilitychange", onVisibilityChange);
		return () => {
			initialController.abort();
			refreshController?.abort();
			window.clearInterval(interval);
			document.removeEventListener("visibilitychange", onVisibilityChange);
		};
	}, []);

	const indexedHealth = useMemo(() => healthIndex(state.snapshot), [state.snapshot]);
	const healthCounts = useMemo(() => {
		const counts: Record<HomelabHealthState, number> = { ok: 0, warn: 0, fail: 0, unknown: 0 };
		for (const service of state.catalog?.services ?? []) counts[effectiveState(service, indexedHealth)] += 1;
		return counts;
	}, [indexedHealth, state.catalog?.services]);

	const hierarchyGroups = useMemo<HierarchyGroup[]>(() => {
		if (!state.catalog) return [];
		const filteredServices = state.catalog.services.filter(
			(service) => healthFilter === "all" || effectiveState(service, indexedHealth) === healthFilter,
		);
		const filteredCatalog = { ...state.catalog, services: filteredServices };
		if (!state.topology) return [{ tier: "support", catalog: filteredCatalog }];

		const topology = state.topology;
		const analysis = analyzeServiceCriticality(topology);
		const grouped = new Map<ServiceCriticalityTier, typeof filteredServices>();
		for (const service of filteredServices) {
			const id = homelabServiceId(service);
			const tier = analysis.get(id)?.tier ?? "support";
			grouped.set(tier, [...(grouped.get(tier) ?? []), service]);
		}
		return [...grouped.entries()]
			.map(([tier, services]) => ({
				tier,
				catalog: {
					...state.catalog,
					services: [...services].sort((left, right) =>
						compareServiceCriticality(
							homelabServiceId(left),
							homelabServiceId(right),
							topology,
							analysis,
						),
					),
				},
			}))
			.sort((left, right) => criticalityTierOrder(left.tier) - criticalityTierOrder(right.tier));
	}, [healthFilter, indexedHealth, state.catalog, state.topology]);

	const visibleHierarchyGroups = useMemo(
		() => tierFilter === "all" ? hierarchyGroups : hierarchyGroups.filter((group) => group.tier === tierFilter),
		[hierarchyGroups, tierFilter],
	);
	const visibleCount = visibleHierarchyGroups.reduce(
		(total, group) => total + group.catalog.services.length,
		0,
	);

	const setTierExpanded = (tier: ServiceCriticalityTier, open: boolean) => {
		setExpandedTiers((current) => {
			const next = new Set(current);
			if (open) next.add(tier);
			else next.delete(tier);
			return next;
		});
	};

	const openCriticality = () => {
		setCriticalityOpen(true);
		window.requestAnimationFrame(() => {
			document.getElementById(CRITICAL_DEPENDENCY_HIERARCHY_ID)?.scrollIntoView({ block: "start" });
		});
	};

	if (!state.catalog) {
		return (
			<div className="text-center py-4" role={state.error ? "alert" : "status"}>
				{state.error ? t("unavailable") : t("loading")}
			</div>
		);
	}

	return (
		<>
			<HomelabStatusOverview
				snapshot={state.snapshot}
				healthUnavailable={state.healthUnavailable}
				healthHttpStatus={state.healthStatus}
				healthRefreshing={state.healthRefreshing}
				onOpenCriticality={openCriticality}
			/>

			<section id="truenas-health-dashboard" className={styles.healthDashboard} aria-labelledby="truenas-health-dashboard-title">
				<div className={styles.healthDashboardHeader}>
					<div>
						<h3 id="truenas-health-dashboard-title" className={styles.healthDashboardTitle}>
							{french ? "Santé et filtres des services" : "Service health and filters"}
						</h3>
						<p>{french ? "Les mêmes états et niveaux de criticité sont utilisés ici et dans Architecture." : "The same health states and criticality tiers are used here and on Architecture."}</p>
					</div>
					<span className={styles.refreshStatus} role="status" aria-live="polite">
						{state.healthRefreshing ? (french ? "Actualisation…" : "Refreshing…") : state.healthUnavailable ? (french ? "Dernier snapshot conservé" : "Keeping last snapshot") : (french ? "Snapshot courant" : "Current snapshot")}
					</span>
				</div>

				<div className={styles.healthSummary} aria-label={french ? "Résumé santé" : "Health summary"}>
					{HEALTH_STATES.map((healthState) => (
						<button
							type="button"
							key={healthState}
							className={styles.healthChip}
							aria-pressed={healthFilter === healthState}
							data-homelab-health-filter={healthState}
							onClick={() => setHealthFilter((current) => current === healthState ? "all" : healthState)}
						>
							<strong>{healthCounts[healthState]}</strong>{" "}
							{healthState === "ok" ? (french ? "sains" : "healthy") : healthState === "warn" ? (french ? "dégradés" : "degraded") : healthState === "fail" ? (french ? "en échec" : "failed") : (french ? "inconnus" : "unknown")}
						</button>
					))}
				</div>

				<div className={styles.controls} data-homelab-hierarchy-controls>
					<label className={styles.filterField}>
						<span className={styles.filterLabel}>{french ? "Santé" : "Health"}</span>
						<select className={styles.filterSelect} value={healthFilter} onChange={(event) => setHealthFilter(event.currentTarget.value as HealthFilter)} data-homelab-health-select>
							<option value="all">{french ? "Tous les états" : "All health states"}</option>
							<option value="ok">{french ? "Sain" : "Healthy"}</option>
							<option value="warn">{french ? "Dégradé" : "Degraded"}</option>
							<option value="fail">{french ? "En échec" : "Failed"}</option>
							<option value="unknown">{french ? "Inconnu" : "Unknown"}</option>
						</select>
					</label>
					<label className={styles.filterField}>
						<span className={styles.filterLabel}>{t("criticality.filterLabel")}</span>
						<select
							className={styles.filterSelect}
							value={tierFilter}
							onChange={(event) => {
								const next = event.currentTarget.value as TierFilter;
								setTierFilter(next);
								if (next !== "all") setTierExpanded(next, true);
							}}
							data-homelab-tier-filter
						>
							<option value="all">{t("criticality.allTiers")}</option>
							{ALL_TIERS.map((tier) => <option value={tier} key={tier}>{t(TIER_TITLE_KEY[tier])}</option>)}
						</select>
					</label>
					<div className={styles.controlButtons}>
						<button type="button" className={styles.controlButton} onClick={() => { setHealthFilter("all"); setTierFilter("all"); }}>
							{french ? "Réinitialiser" : "Reset filters"}
						</button>
						<button type="button" className={styles.controlButton} onClick={() => setExpandedTiers(new Set(ALL_TIERS))} aria-controls="homelab-service-hierarchy">
							{t("criticality.expandAll")}
						</button>
						<button type="button" className={styles.controlButton} onClick={() => setExpandedTiers(new Set())} aria-controls="homelab-service-hierarchy">
							{t("criticality.collapseAll")}
						</button>
					</div>
				</div>
				<p className={styles.matchCount}>{french ? `${visibleCount} services affichés sur ${state.catalog.services.length}` : `${visibleCount} services shown of ${state.catalog.services.length}`}</p>
			</section>

			<div id="homelab-service-hierarchy" data-homelab-service-hierarchy>
				{visibleHierarchyGroups.map((group) => (
					<details
						className={styles.groupDetails}
						key={group.tier}
						open={expandedTiers.has(group.tier)}
						onToggle={(event) => setTierExpanded(group.tier, event.currentTarget.open)}
						data-service-criticality-group={group.tier}
					>
						<summary className={styles.groupSummary}>
							<span className={styles.groupTitle}>
								<strong>{t(TIER_TITLE_KEY[group.tier])}</strong>
								<span className={styles.groupDescription}>{t(TIER_DESCRIPTION_KEY[group.tier])}</span>
							</span>
							<span className={styles.groupMeta}>{t("criticality.componentCount", { count: group.catalog.services.length })}</span>
						</summary>
						<div className={`${styles.groupBody} homelab-service-subgrid`}>
							<HomelabServiceGrid
								catalog={group.catalog}
								snapshot={state.snapshot}
								healthUnavailable={state.healthUnavailable}
								healthHttpStatus={state.healthStatus}
							/>
						</div>
					</details>
				))}
			</div>

			{state.topology ? (
				<CriticalDependencyHierarchy topology={state.topology} open={criticalityOpen} onOpenChange={setCriticalityOpen} />
			) : null}

			<style jsx global>{`
				.homelab-service-subgrid > .alert,
				.homelab-service-subgrid > [data-truenas-runtime-legend],
				.homelab-service-subgrid > [data-dependency-health-legend] {
					display: none !important;
				}
			`}</style>
		</>
	);
}
