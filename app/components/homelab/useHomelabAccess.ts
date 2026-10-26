"use client";

import { useEffect, useState } from "react";
import { clearPublicHomelabBrowserCache } from "@/lib/homelabPublicBrowserCache";
import {
	ACCESS_RECHECK_MS,
	createHomelabAccessProbe,
	parseHomelabAccessDecision,
	type HomelabAccessDecision,
	type HomelabAccessState,
} from "@/lib/homelabBrowserAccess";

export type { HomelabAccessState } from "@/lib/homelabBrowserAccess";

function clearPublishedCacheOnExplicitDenial(): void {
	try {
		clearPublicHomelabBrowserCache(window.localStorage);
	} catch {
		// Storage can be unavailable. Authorization always remains server-side.
	}
}

async function fetchHomelabAccess(): Promise<HomelabAccessDecision> {
	const response = await fetch("/api/homelab-access", {
		cache: "no-store",
		credentials: "same-origin",
		signal: AbortSignal.timeout(5_000),
		headers: { Accept: "application/json" },
	});
	if (!response.ok) {
		// Do not destroy a public-only cache because of HTTP 429, 5xx or timeout.
		if ([401, 403, 404].includes(response.status)) clearPublishedCacheOnExplicitDenial();
		throw new Error(`access HTTP ${response.status}`);
	}
	const access = parseHomelabAccessDecision(await response.json());
	if (access === "denied") clearPublishedCacheOnExplicitDenial();
	return access;
}

// TrueNAS and Architecture mount several gates. Share one in-flight request,
// but never cache a trusted decision indefinitely across Wi-Fi/VPN changes.
const accessProbe = createHomelabAccessProbe(fetchHomelabAccess);

/**
 * UI gating only: every restricted endpoint still authorizes independently.
 * Recheck access on focus/visibility and every 30 seconds in visible tabs.
 */
export default function useHomelabAccess(): HomelabAccessState {
	const [state, setState] = useState<HomelabAccessState>("pending");

	useEffect(() => {
		let active = true;
		const refresh = (onFocus = false) => {
			if (document.hidden) return;
			// Unmount previously visible OWNER content while access is rechecked.
			if (accessProbe.shouldRecheck(onFocus)) setState("pending");
			void accessProbe.check(onFocus).then((access) => {
				if (!active) return;
				setState(access);
			});
		};

		refresh();
		const onVisibilityOrFocus = () => refresh(true);
		const onVisibilityChange = () => {
			if (!document.hidden) onVisibilityOrFocus();
		};
		const interval = window.setInterval(() => refresh(), ACCESS_RECHECK_MS);
		document.addEventListener("visibilitychange", onVisibilityChange);
		window.addEventListener("focus", onVisibilityOrFocus);
		return () => {
			active = false;
			window.clearInterval(interval);
			document.removeEventListener("visibilitychange", onVisibilityChange);
			window.removeEventListener("focus", onVisibilityOrFocus);
		};
	}, []);

	return state;
}
