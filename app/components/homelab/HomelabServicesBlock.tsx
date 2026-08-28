"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import type { HomelabHealthSnapshot } from "@/lib/homelabHealth";
import {
	analyzeServiceCriticality,
	compareServiceCriticality,
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
			snapshot: (await response.json()) as HomelabHealthSnapshot,
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

	const orderedCatalog = useMemo(() => {
		if (!state.catalog || !state.topology) return state.catalog;
		const topology = state.topology;
		const analysis = analyzeServiceCriticality(topology);
		return {
			...state.catalog,
			services: [...state.catalog.services].sort((left, right) =>
				compareServiceCriticality(
					homelabServiceId(left),
					homelabServiceId(right),
					topology,
					analysis,
				),
			),
		};
	}, [state.catalog, state.topology]);

	if (!orderedCatalog) {
		return (
			<div className="text-center py-4" role={state.error ? "alert" : "status"}>
				{state.error ? t("unavailable") : t("loading")}
			</div>
		);
	}

	return (
		<>
			{state.topology ? (
				<ServiceCriticalityOverview topology={state.topology} compact />
			) : null}
			<HomelabServiceGrid
				catalog={orderedCatalog}
				snapshot={state.snapshot}
				healthUnavailable={state.healthUnavailable}
				healthHttpStatus={state.healthStatus}
			/>
		</>
	);
}
