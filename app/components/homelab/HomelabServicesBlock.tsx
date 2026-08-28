"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import {
	parseHomelabHealthSnapshot,
	type HomelabHealthSnapshot,
} from "@/lib/homelabHealth";
import {
	analyzeServiceCriticality,
	compareServiceCriticality,
	criticalityTierOrder,
	type ServiceCriticalityTier,
} from "@/lib/serviceCriticality";
import {
	homelabServiceId,
	type HomelabServicesCatalog,
} from "@/lib/homelabServices";
import {
	parseServiceTopology,
	type ServiceTopology,
} from "@/lib/serviceTopology";
import HomelabServiceGrid from "./HomelabServiceGrid";
import PfSenseDnsPosture from "./PfSenseDnsPosture";
import ServiceCriticalityOverview from "./ServiceCriticalityOverview";

const HEALTH_REFRESH_MS = 30_000;

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
};

type HierarchyGroup = {
	tier: ServiceCriticalityTier;
	catalog: HomelabServicesCatalog;
};

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

async function fetchCatalog(
	signal: AbortSignal,
): Promise<HomelabServicesCatalog> {
	const response = await fetch("/api/homelab-services", {
		cache: "no-store",
		signal,
	});
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
		const response = await fetch("/api/homelab-health", {
			cache: "no-store",
			signal,
		});
		if (!response.ok) {
			return { snapshot: null, status: response.status };
		}
		return {
			snapshot: parseHomelabHealthSnapshot(await response.json()),
			status: response.status,
		};
	} catch (error) {
		if (signal.aborted) throw error;
		return { snapshot: null, status: null };
	}
}

export default function HomelabServicesBlock() {
	const t = useTranslations("homelab");
	const [state, setState] = useState<State>({
		catalog: null,
		topology: null,
		snapshot: null,
		error: false,
		healthUnavailable: false,
		healthStatus: null,
	});

	useEffect(() => {
		const initialController = new AbortController();
		let refreshController: AbortController | null = null;

		const refreshHealth = async () => {
			if (document.hidden) return;
			refreshController?.abort();
			refreshController = new AbortController();
			const health = await fetchHealth(refreshController.signal);
			if (!refreshController.signal.aborted) {
				setState((current) => ({
					...current,
					// Keep the last known snapshot for context, but explicitly mark it stale
					// when the live FastAPI refresh fails so the UI never hides a 503/reboot.
					snapshot: health.snapshot ?? current.snapshot,
					healthUnavailable: health.snapshot === null,
					healthStatus: health.status,
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
					});
				}
			})
			.catch(() => {
				if (!initialController.signal.aborted) {
					setState((current) => ({
						...current,
						error: true,
						healthUnavailable: true,
					}));
				}
			});

		const interval = window.setInterval(() => {
			void refreshHealth();
		}, HEALTH_REFRESH_MS);
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

	const hierarchyGroups = useMemo<HierarchyGroup[]>(() => {
		if (!state.catalog) return [];
		if (!state.topology) {
			return [{ tier: "support", catalog: state.catalog }];
		}

		const topology = state.topology;
		const analysis = analyzeServiceCriticality(topology);
		const grouped = new Map<ServiceCriticalityTier, typeof state.catalog.services>();

		for (const service of state.catalog.services) {
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
			.sort(
				(left, right) =>
					criticalityTierOrder(left.tier) - criticalityTierOrder(right.tier),
			);
	}, [state.catalog, state.topology]);

	if (!state.catalog) {
		return (
			<div className="text-center py-4" role={state.error ? "alert" : "status"}>
				{state.error ? t("unavailable") : t("loading")}
			</div>
		);
	}

	return (
		<>
			<PfSenseDnsPosture
				snapshot={state.snapshot}
				healthUnavailable={state.healthUnavailable}
			/>
			{state.topology ? (
				<ServiceCriticalityOverview topology={state.topology} compact />
			) : null}
			<div data-homelab-service-hierarchy>
				{hierarchyGroups.map((group, index) => (
					<section
						className="mb-4"
						key={group.tier}
						data-service-criticality-group={group.tier}
					>
						<div className="d-flex flex-wrap align-items-end justify-content-between gap-2 border-bottom border-secondary pb-2 mb-2">
							<div>
								<h3 className="h4 mb-1">{t(TIER_TITLE_KEY[group.tier])}</h3>
								<p className="small text-body-secondary mb-0">
									{t(TIER_DESCRIPTION_KEY[group.tier])}
								</p>
							</div>
							<span className="badge text-bg-secondary">
								{t("criticality.componentCount", {
									count: group.catalog.services.length,
								})}
							</span>
						</div>
						<div className={index === 0 ? undefined : "homelab-service-subgrid"}>
							<HomelabServiceGrid
								catalog={group.catalog}
								snapshot={state.snapshot}
								healthUnavailable={state.healthUnavailable}
								healthHttpStatus={state.healthStatus}
							/>
						</div>
					</section>
				))}
			</div>
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
