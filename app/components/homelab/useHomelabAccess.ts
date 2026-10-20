"use client";

import { useEffect, useState } from "react";

export type HomelabAccessState = "pending" | "trusted" | "denied";

// One probe per page load shared by every gate on the page (TrueNAS mounts
// two). A failed probe is forgotten so the next mount can retry.
let accessProbe: Promise<boolean> | null = null;

async function probeHomelabAccess(): Promise<boolean> {
	const response = await fetch("/api/homelab-access", {
		cache: "no-store",
		credentials: "same-origin",
		headers: { Accept: "application/json" },
	});
	if (!response.ok) throw new Error(`access HTTP ${response.status}`);
	const body: unknown = await response.json();
	return (
		typeof body === "object" &&
		body !== null &&
		(body as { trusted?: unknown }).trusted === true
	);
}

function sharedAccessProbe(): Promise<boolean> {
	accessProbe ??= probeHomelabAccess().catch(() => {
		accessProbe = null;
		return false;
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
		sharedAccessProbe().then((trusted) => {
			if (active) setState(trusted ? "trusted" : "denied");
		});
		return () => {
			active = false;
		};
	}, []);

	return state;
}
