"use client";

import { useEffect, useState } from "react";
import {
	type HomelabHealthSnapshot,
	parseHomelabHealthSnapshot,
} from "@/lib/homelabHealth";
import {
	boundedHomelabSignal,
	homelabRetryDelayMs,
} from "@/lib/homelabSlowApiPolicy";
import {
	markSiteHealthStale,
	parseSiteHealthV2,
	type SiteHealthV2,
} from "@/lib/siteHealthV2";

export type ArchitectureHealthSource =
	| "loading"
	| "fastapi"
	| "site-v2"
	| "unavailable";

const HEALTH_POLL_REFRESHING_MS = 30_000;
const HEALTH_POLL_FRESH_MS = 30_000;
const HEALTH_POLL_FALLBACK_MS = 60_000;
// A resumed SERVICE tab must not display green health from hours earlier.
const PUBLIC_EVIDENCE_STALE_AFTER_MS = 120_000;

export function architectureHealthPollDelay(
	snapshot: HomelabHealthSnapshot | null,
	unavailable: boolean,
): number {
	if (unavailable) return HEALTH_POLL_FALLBACK_MS;
	if (snapshot?.health_board?.refreshing) return HEALTH_POLL_REFRESHING_MS;
	if (snapshot?.health_board?.state === "fresh") return HEALTH_POLL_FRESH_MS;
	return HEALTH_POLL_FALLBACK_MS;
}

export default function useArchitectureHealthPolling(readOnly = false) {
	const [health, setHealth] = useState<HomelabHealthSnapshot | null>(null);
	const [siteHealth, setSiteHealth] = useState<SiteHealthV2 | null>(null);
	const [healthUnavailable, setHealthUnavailable] = useState(false);
	const [refreshing, setRefreshing] = useState(true);

	useEffect(() => {
		let active = true;
		let controller: AbortController | null = null;
		let refreshTimer: number | null = null;
		let latestSnapshot: HomelabHealthSnapshot | null = null;
		let latestUnavailable = true;
		let consecutiveFailures = 0;
		let hiddenSince: number | null = document.hidden ? Date.now() : null;

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
				latestUnavailable
					? homelabRetryDelayMs(Math.max(1, consecutiveFailures))
					: architectureHealthPollDelay(latestSnapshot, false),
			);
		};

		const loadHealth = async () => {
			if (document.hidden) return;
			controller?.abort();
			const requestController = new AbortController();
			controller = requestController;
			setRefreshing(true);
			try {
				const response = await fetch(
					readOnly ? "/api/homelab-health-v2" : "/api/homelab-health",
					{
						cache: "no-store",
						signal: boundedHomelabSignal(requestController.signal),
						headers: { Accept: "application/json" },
					},
				);
				if (!active || requestController.signal.aborted) return;
				if (!response.ok) throw new Error(`health HTTP ${response.status}`);
				if (readOnly) {
					const projected = parseSiteHealthV2(await response.json());
					if (!active || requestController.signal.aborted) return;
					if (!projected) throw new Error("invalid v2 health projection");
					consecutiveFailures = 0;
					latestSnapshot = null;
					latestUnavailable = projected.boardState !== "fresh";
					if (active) {
						setSiteHealth(projected);
						setHealth(null);
						setHealthUnavailable(latestUnavailable);
					}
				} else {
					const parsed = parseHomelabHealthSnapshot(await response.json());
					if (!active || requestController.signal.aborted) return;
					if (!parsed) throw new Error("invalid health payload");
					consecutiveFailures = 0;
					latestSnapshot = parsed;
					latestUnavailable = false;
					if (active) {
						setHealth(parsed);
						setSiteHealth(null);
						setHealthUnavailable(false);
					}
				}
			} catch {
				if (active && !requestController.signal.aborted) {
					latestUnavailable = true;
					consecutiveFailures += 1;
					// Keep only the last PUBLIC identities, never old healthy
					// evidence; OWNER diagnostics are cleared on every failure.
					setHealth(null);
					setSiteHealth((current) =>
						readOnly && current ? markSiteHealthStale(current) : null,
					);
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
		const onVisibilityChange = () => {
			if (document.hidden) {
				hiddenSince = Date.now();
				clearRefreshTimer();
				controller?.abort();
				return;
			}
			// Preserve the authorized SERVICE view while invalidating old evidence.
			if (
				readOnly &&
				hiddenSince !== null &&
				Date.now() - hiddenSince >= PUBLIC_EVIDENCE_STALE_AFTER_MS
			) {
				setSiteHealth((current) =>
					current ? markSiteHealthStale(current) : null,
				);
				setHealthUnavailable(true);
			}
			hiddenSince = null;
			void loadHealth();
		};
		document.addEventListener("visibilitychange", onVisibilityChange);
		return () => {
			active = false;
			controller?.abort();
			clearRefreshTimer();
			document.removeEventListener("visibilitychange", onVisibilityChange);
		};
	}, [readOnly]);

	// Access changes can precede effect cleanup. Mask cached OWNER data immediately.
	const visibleHealth = readOnly ? null : health;
	const visibleSiteHealth = readOnly ? siteHealth : null;
	const healthSource: ArchitectureHealthSource = healthUnavailable
		? "unavailable"
		: readOnly
			? visibleSiteHealth
				? "site-v2"
				: "loading"
			: visibleHealth
				? "fastapi"
				: "loading";

	return {
		health: visibleHealth,
		siteHealth: visibleSiteHealth,
		healthUnavailable,
		refreshing,
		healthSource,
	} as const;
}
