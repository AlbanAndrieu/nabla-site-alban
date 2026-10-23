"use client";

import { useEffect, useState } from "react";
import { clearPublicHomelabBrowserCache } from "@/lib/homelabPublicBrowserCache";

export type HomelabAccessState = "pending" | "trusted" | "readonly" | "denied";

// One probe per page load shared by every gate on the page (TrueNAS mounts
// two). A failed probe is forgotten so the next mount can retry.
let accessProbe: Promise<HomelabAccessState> | null = null;

async function probeHomelabAccess(): Promise<HomelabAccessState> {
	const response = await fetch("/api/homelab-access", {
		cache: "no-store",
		credentials: "same-origin",
		headers: { Accept: "application/json" },
	});
	if (!response.ok) throw new Error(`access HTTP ${response.status}`);
	const body: unknown = await response.json();
	if (typeof body !== "object" || body === null) return "denied";
	const result = body as { trusted?: unknown; mode?: unknown };
	if (result.trusted !== true) return "denied";
	return result.mode === "public-readonly" ? "readonly" : "trusted";
}

function sharedAccessProbe(): Promise<HomelabAccessState> {
	accessProbe ??= probeHomelabAccess().catch(() => {
		accessProbe = null;
		return "denied";
	});
	return accessProbe;
}

/**
 * Asks the server whether this browser may load the owner-only homelab views
 * (owner network or verified Cloudflare Access). This only decides what to
 * render: every private datum is still fetched from a server-gated route.
 */
export default function useHomelabAccess(): HomelabAccessState {
	const [state, setState] = useState<HomelabAccessState>("pending");

	useEffect(() => {
		let active = true;
		sharedAccessProbe().then((access) => {
			if (!active) return;
			if (access === "denied") {
				// Public data was intentionally retained for offline display only
				// while access was allowed. Revocation invalidates both cache keys.
				try {
					clearPublicHomelabBrowserCache(window.localStorage);
				} catch {
					// Storage may be blocked; the access gate still denies rendering.
				}
			}
			setState(access);
		});
		return () => {
			active = false;
		};
	}, []);

	return state;
}
