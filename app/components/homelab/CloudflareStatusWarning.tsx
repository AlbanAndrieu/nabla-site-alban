"use client";

import { useLocale } from "next-intl";
import { useEffect, useState } from "react";

type CloudflareComponent = {
	id?: string;
	state?: string;
	reachable?: boolean | null;
};

type ObservabilitySnapshot = {
	components?: CloudflareComponent[];
};

const REFRESH_MS = 30_000;

function cloudflareUnconfirmed(snapshot: ObservabilitySnapshot | null): boolean {
	const cloudflare = snapshot?.components?.find(
		(component) => component.id === "cloudflare",
	);
	if (!cloudflare) return true;
	if (cloudflare.state === "fail" || cloudflare.reachable === false) return false;
	return cloudflare.state === "unknown" || cloudflare.reachable === null;
}

export default function CloudflareStatusWarning() {
	const french = useLocale() === "fr";
	const [unconfirmed, setUnconfirmed] = useState(false);

	useEffect(() => {
		let active = true;
		let controller: AbortController | null = null;

		const load = async () => {
			if (document.hidden) return;
			controller?.abort();
			controller = new AbortController();
			try {
				const response = await fetch("/api/homelab-observability", {
					cache: "no-store",
					signal: controller.signal,
					headers: { Accept: "application/json" },
				});
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				const payload = (await response.json()) as ObservabilitySnapshot;
				if (active) setUnconfirmed(cloudflareUnconfirmed(payload));
			} catch {
				if (active && !controller.signal.aborted) setUnconfirmed(true);
			}
		};

		void load();
		const timer = window.setInterval(() => void load(), REFRESH_MS);
		const onVisibilityChange = () => {
			if (!document.hidden) void load();
		};
		document.addEventListener("visibilitychange", onVisibilityChange);
		return () => {
			active = false;
			controller?.abort();
			window.clearInterval(timer);
			document.removeEventListener("visibilitychange", onVisibilityChange);
		};
	}, []);

	if (!unconfirmed) return null;

	return (
		<div
			className="alert alert-warning py-2"
			role="status"
			data-cloudflare-status-unconfirmed
		>
			<strong>⚠️ Cloudflare</strong>{" "}
			{french
				? "Le statut global n’a pas pu être confirmé (données absentes, timeout ou erreur de connexion). Cette incertitude reste un avertissement et ne passe pas les services en panne ou en état dégradé."
				: "Global status could not be confirmed (missing data, timeout, or connection error). This uncertainty remains a warning and does not mark services down or degraded."}
		</div>
	);
}
