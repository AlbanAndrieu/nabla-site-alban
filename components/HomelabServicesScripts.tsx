"use client";

import { useEffect } from "react";

function appendScriptOnce(src: string) {
	return new Promise<void>((resolve, reject) => {
		const existing = document.querySelector(`script[src$="${src}"]`);
		if (existing) {
			resolve();
			return;
		}
		const el = document.createElement("script");
		el.src = src;
		el.async = true;
		el.onload = () => resolve();
		el.onerror = () => reject(new Error(`Failed to load ${src}`));
		document.body.appendChild(el);
	});
}

/**
 * Static `nabla.html` / `truenas.html` load these after `</main>`; the App Router only embeds `<main>`.
 * Load after mount so React hydration does not replace client-filled `[data-homelab-services-root]` markup.
 *
 * Do not bail mid-sequence on effect cleanup: React Strict Mode runs cleanup between awaits, which would
 * skip `homelab-services-render.js` and leave cards empty in development.
 */
export default function HomelabServicesScripts() {
	useEffect(() => {
		void (async () => {
			try {
				await appendScriptOnce("/nabla-service-status.js");
				await appendScriptOnce("/homelab-services-render.js");
			} catch (e) {
				console.error("[HomelabServicesScripts]", e);
			}
		})();
	}, []);

	return null;
}
