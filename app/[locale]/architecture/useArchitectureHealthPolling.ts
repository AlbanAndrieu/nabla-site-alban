"use client";

import { useEffect, useState } from "react";
import {
	type HomelabHealthSnapshot,
	parseHomelabHealthSnapshot,
} from "@/lib/homelabHealth";

export type ArchitectureHealthSource = "loading" | "fastapi" | "unavailable";

const HEALTH_POLL_REFRESHING_MS = 2_000;
const HEALTH_POLL_FRESH_MS = 5_000;
const HEALTH_POLL_FALLBACK_MS = 30_000;

export function architectureHealthPollDelay(
	snapshot: HomelabHealthSnapshot | null,
	unavailable: boolean,
): number {
	if (unavailable) return HEALTH_POLL_FALLBACK_MS;
	if (snapshot?.health_board?.refreshing) return HEALTH_POLL_REFRESHING_MS;
	if (snapshot?.health_board?.state === "fresh") return HEALTH_POLL_FRESH_MS;
	return HEALTH_POLL_FALLBACK_MS;
}

export default function useArchitectureHealthPolling() {
	const [health, setHealth] = useState<HomelabHealthSnapshot | null>(null);
	const [healthUnavailable, setHealthUnavailable] = useState(false);
	const [refreshing, setRefreshing] = useState(true);
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		let active = true;
		let controller: AbortController | null = null;
		let refreshTimer: number | null = null;
		let latestSnapshot: HomelabHealthSnapshot | null = null;
		let latestUnavailable = true;

		const clearRefreshTimer = () => {
			if (refreshTimer === null) return;
			window.clearTimeout(refreshTimer);
			refreshTimer = null;
		};

		const scheduleNext = () => {
			if (!active || document.hidden) return;
			clearRefreshTimer();
			refreshTimer = window.setTimeout(
				() => void loadHealth(),
				architectureHealthPollDelay(latestSnapshot, latestUnavailable),
			);
		};

		const loadHealth = async () => {
			if (document.hidden) return;
			controller?.abort();
			const requestController = new AbortController();
			controller = requestController;
			setRefreshing(true);
			try {
				const response = await fetch("/api/homelab-health", {
					cache: "no-store",
					signal: requestController.signal,
					headers: { Accept: "application/json" },
				});
				if (!response.ok) {
					throw new Error(`health HTTP ${response.status}`);
				}
				const parsed = parseHomelabHealthSnapshot(await response.json());
				if (!parsed) throw new Error("invalid health payload");
				latestSnapshot = parsed;
				latestUnavailable = false;
				if (active) {
					setHealth(parsed);
					setHealthUnavailable(false);
					setNow(Date.now());
				}
			} catch {
				if (active && !requestController.signal.aborted) {
					latestUnavailable = true;
					setHealthUnavailable(true);
				}
			} finally {
				if (active && !requestController.signal.aborted) {
					setRefreshing(false);
					scheduleNext();
				}
			}
		};

		void loadHealth();
		const clockTimer = window.setInterval(() => setNow(Date.now()), 5_000);
		const onVisibilityChange = () => {
			if (document.hidden) {
				clearRefreshTimer();
				controller?.abort();
				return;
			}
			void loadHealth();
		};
		document.addEventListener("visibilitychange", onVisibilityChange);
		return () => {
			active = false;
			controller?.abort();
			clearRefreshTimer();
			window.clearInterval(clockTimer);
			document.removeEventListener("visibilitychange", onVisibilityChange);
		};
	}, []);

	const healthSource: ArchitectureHealthSource = healthUnavailable
		? "unavailable"
		: health
			? "fastapi"
			: "loading";

	return { health, healthUnavailable, refreshing, now, healthSource } as const;
}
