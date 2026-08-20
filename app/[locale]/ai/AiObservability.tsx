"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function AiObservability({ locale }: { locale: string }) {
	const french = locale === "fr";
	const [mountPoint, setMountPoint] = useState<HTMLElement | null>(null);

	useEffect(() => {
		const section = document.getElementById("ai-token-finops");
		const heading = document.getElementById("ai-token-finops-heading");
		const description = section?.querySelector(":scope > p");
		const grid = section?.querySelector(".resource-grid");
		if (!section || !heading || !grid) return;

		heading.innerHTML = `<i class="fas fa-chart-line" aria-hidden="true"></i> ${
			french ? "Observabilité, évaluation & FinOps LLM" : "LLM observability, evaluation & FinOps"
		}`;
		if (description) {
			description.textContent = french
				? "Une vue unifiée de la qualité, des traces, des coûts, des tokens et des latences : évaluez les applications LLM, surveillez leur comportement en production et appliquez une discipline FinOps à la consommation des modèles."
				: "A unified view of quality, traces, costs, tokens, and latency: evaluate LLM applications, monitor production behavior, and apply FinOps discipline to model consumption.";
		}

		const host = document.createElement("div");
		host.style.display = "contents";
		grid.prepend(host);
		setMountPoint(host);
		return () => host.remove();
	}, [french]);

	if (!mountPoint) return null;

	return createPortal(
		<>
			<article id="opik" className="resource-card">
				<h3><i className="fas fa-chart-line resource-card-icon" aria-hidden="true" /> Opik by Comet</h3>
				<p>{french ? "Plateforme open source d’évaluation, de test et de monitoring des applications LLM, utile pour comparer les sorties des modèles et suivre leur qualité en production." : "Open-source platform for evaluating, testing, and monitoring LLM applications, useful for comparing model outputs and tracking production quality."}</p>
				<a href="https://www.comet.com/docs/opik/" target="_blank" rel="noopener noreferrer" className="resource-link"><i className="fas fa-book" aria-hidden="true" /> Documentation</a>
			</article>
			<article id="langfuse" className="resource-card">
				<h3><i className="fas fa-eye resource-card-icon" aria-hidden="true" /> Langfuse</h3>
				<p>{french ? "Plateforme open source d’observabilité LLM pour les traces, prompts, scores, coûts et latences. Langfuse collecte notamment la télémétrie de LiteLLM et du serveur MCP afin de fournir une vue transverse des appels IA." : "Open-source LLM observability platform for traces, prompts, scores, costs, and latency. Langfuse collects telemetry from LiteLLM and the MCP server to provide a cross-platform view of AI calls."}</p>
				<a href="https://langfuse.com/" target="_blank" rel="noopener noreferrer" className="resource-link"><i className="fas fa-external-link-alt" aria-hidden="true" /> Langfuse</a>
			</article>
		</>,
		mountPoint,
	);
}
