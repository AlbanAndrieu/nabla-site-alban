"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { HomelabHealthSnapshot } from "@/lib/homelabHealth";
import type { HomelabServicesCatalog } from "@/lib/homelabServices";
import HomelabServiceGrid from "./HomelabServiceGrid";

const HEALTH_REFRESH_MS = 30_000;

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

export default function HomelabServicesBlock() {
	const t = useTranslations("homelab");
	const [state, setState] = useState<State>({
		catalog: null,
		snapshot: null,
		error: false,
	});

	useEffect(() => {
		const initialController = new AbortController();
		let refreshController: AbortController | null = null;

		const refreshHealth = async () => {
			if (document.hidden) return;
			refreshController?.abort();
			refreshController = new AbortController();
			const snapshot = await fetchHealth(refreshController.signal);
			if (!refreshController.signal.aborted) {
				setState((current) => ({
					...current,
					// Keep the last known good snapshot during transient backend failures.
					snapshot: snapshot ?? current.snapshot,
					error: current.catalog === null && snapshot === null,
				}));
			}
		};

		void Promise.all([
			fetchCatalog(initialController.signal),
			fetchHealth(initialController.signal),
		])
			.then(([catalog, snapshot]) => {
				if (!initialController.signal.aborted) {
					setState({ catalog, snapshot, error: false });
				}
			})
			.catch(() => {
				if (!initialController.signal.aborted) {
					setState((current) => ({ ...current, error: true }));
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

	if (!state.catalog) {
		return (
			<div className="text-center py-4" role={state.error ? "alert" : "status"}>
				{state.error ? t("unavailable") : t("loading")}
			</div>
		);
	}

	return <HomelabServiceGrid catalog={state.catalog} snapshot={state.snapshot} />;
}
