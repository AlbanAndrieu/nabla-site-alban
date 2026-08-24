"use client";

import { useEffect, useState } from "react";
import type {
	HomelabHealthEntry,
	HomelabHealthSnapshot,
} from "@/lib/homelabHealth";
import type { HomelabServicesCatalog } from "@/lib/homelabServices";
import HomelabServiceGrid from "./HomelabServiceGrid";

type Props = {
	endpointLabel: string;
	internalLabel: string;
};

type State = {
	catalog: HomelabServicesCatalog | null;
	snapshot: HomelabHealthSnapshot | null;
	error: boolean;
};

async function fetchCatalog(signal: AbortSignal): Promise<HomelabServicesCatalog> {
	const response = await fetch("/api/homelab-services", {
		cache: "no-store",
		signal,
	});
	if (!response.ok) throw new Error(`catalog HTTP ${response.status}`);
	return (await response.json()) as HomelabServicesCatalog;
}

async function fetchDirectTrueNasHealth(
	signal: AbortSignal,
): Promise<HomelabHealthEntry | null> {
	try {
		const response = await fetch("/api/truenas-health", {
			cache: "no-store",
			signal,
		});
		return response.ok ? ((await response.json()) as HomelabHealthEntry) : null;
	} catch (error) {
		if (signal.aborted) throw error;
		return null;
	}
}

async function fetchHealth(signal: AbortSignal): Promise<HomelabHealthSnapshot | null> {
	try {
		const [healthResponse, directTrueNas] = await Promise.all([
			fetch("/api/homelab-health", {
				cache: "no-store",
				signal,
			}),
			fetchDirectTrueNasHealth(signal),
		]);
		const snapshot = healthResponse.ok
			? ((await healthResponse.json()) as HomelabHealthSnapshot)
			: null;

		if (!directTrueNas?.reachable) return snapshot;
		if (!snapshot) {
			return {
				schema_version: 2,
				checked_at: new Date().toISOString(),
				services: [],
				truenas: { state: "ok", public: directTrueNas },
			};
		}

		return {
			...snapshot,
			truenas: {
				...(snapshot.truenas ?? {}),
				state: "ok",
				public: directTrueNas,
			},
		};
	} catch (error) {
		if (signal.aborted) throw error;
		return null;
	}
}

export default function HomelabServicesBlock({ endpointLabel, internalLabel }: Props) {
	const [state, setState] = useState<State>({
		catalog: null,
		snapshot: null,
		error: false,
	});

	useEffect(() => {
		const controller = new AbortController();

		void Promise.all([
			fetchCatalog(controller.signal),
			fetchHealth(controller.signal),
		])
			.then(([catalog, snapshot]) => {
				if (!controller.signal.aborted) {
					setState({ catalog, snapshot, error: false });
				}
			})
			.catch(() => {
				if (!controller.signal.aborted) {
					setState((current) => ({ ...current, error: true }));
				}
			});

		return () => controller.abort();
	}, []);

	if (!state.catalog) {
		return (
			<div className="text-center py-4" role={state.error ? "alert" : "status"}>
				{state.error ? "Homelab services are temporarily unavailable." : "Loading homelab services…"}
			</div>
		);
	}

	return (
		<HomelabServiceGrid
			catalog={state.catalog}
			snapshot={state.snapshot}
			endpointLabel={endpointLabel}
			internalLabel={internalLabel}
		/>
	);
}
