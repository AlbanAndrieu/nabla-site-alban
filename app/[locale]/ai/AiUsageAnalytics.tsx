"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function AiUsageAnalytics({ locale }: { locale: string }) {
	const french = locale === "fr";
	const [mountPoint, setMountPoint] = useState<HTMLElement | null>(null);

	useEffect(() => {
		const section = document.getElementById("ai-token-finops");
		const grid = section?.querySelector(".resource-grid");
		const cursorCard = grid?.querySelector(".resource-card");
		if (!grid || !cursorCard) return;

		const host = document.createElement("div");
		host.style.display = "contents";
		cursorCard.insertAdjacentElement("afterend", host);
		setMountPoint(host);

		return () => host.remove();
	}, []);

	if (!mountPoint) return null;

	return createPortal(
		<article className="resource-card">
			<h3>
				<i className="fas fa-chart-line resource-card-icon" aria-hidden="true" /> ChatGPT / Codex usage analytics
			</h3>
			<p>
				{french
					? "Suivez l’utilisation de ChatGPT et Codex : crédits, tokens, modèles, activité et consommation. Les vues disponibles dépendent du type d’espace de travail ; Codex expose également des détails d’utilisation et de limites dans les paramètres pris en charge."
					: "Track ChatGPT and Codex usage across credits, tokens, models, activity, and consumption. Available analytics depend on the workspace plan; Codex also exposes usage and limit details in supported account settings."}
			</p>
			<a href="https://help.openai.com/en/articles/12289294-global-admin-console" target="_blank" rel="noopener noreferrer" className="resource-link">
				<i className="fas fa-external-link-alt" aria-hidden="true" /> {french ? "Analyses ChatGPT / Codex" : "ChatGPT / Codex analytics"}
			</a>
		</article>,
		mountPoint,
	);
}
