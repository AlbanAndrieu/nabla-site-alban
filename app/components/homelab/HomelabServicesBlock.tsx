"use client";

import { useEffect, useState } from "react";
import type { HomelabHealthSnapshot } from "@/lib/homelabHealth";
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

async function fetchHealth(signal: AbortSignal): Promise<HomelabHealthSnapshot | null> {
	try {
		const response = await fetch("/api/homelab-health", {
			cache: "no-store",
			signal,
		});
		return response.ok ? ((await response.json()) as HomelabHealthSnapshot) : null;
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
				{state.error
					? "Homelab services are temporarily unavailable."
					: "Loading homelab services…"}
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
