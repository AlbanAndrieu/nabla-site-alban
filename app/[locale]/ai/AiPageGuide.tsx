"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const sections = [
	{
		id: "workflow-automation-ai-tools",
		icon: "fa-robot",
		en: "Agents & automation",
		fr: "Agents & automatisation",
	},
	{
		id: "ai-models-frameworks",
		icon: "fa-microchip",
		en: "Models & frameworks",
		fr: "Modèles & frameworks",
	},
	{
		id: "document-pipeline",
		icon: "fa-file-lines",
		en: "Knowledge & RAG",
		fr: "Knowledge & RAG",
	},
	{
		id: "ai-homelab-heading",
		icon: "fa-network-wired",
		en: "AI architecture",
		fr: "Architecture IA",
	},
	{
		id: "ai-token-finops",
		icon: "fa-chart-line",
		en: "Observability & FinOps",
		fr: "Observabilité & FinOps",
	},
	{
		id: "general-best-practices",
		icon: "fa-shield-halved",
		en: "Security & practices",
		fr: "Sécurité & pratiques",
	},
] as const;

export default function AiPageGuide({ locale }: { locale: string }) {
	const french = locale === "fr";
	const [mountPoint, setMountPoint] = useState<HTMLElement | null>(null);

	useEffect(() => {
		const intro = document.getElementById("introduction");
		if (!intro?.parentElement) return;
		const host = document.createElement("div");
		host.className = "ai-page-guide-host";
		intro.insertAdjacentElement("afterend", host);
		setMountPoint(host);
		return () => host.remove();
	}, []);

	if (!mountPoint) return null;

	return createPortal(
		<section
			className="category-section"
			aria-labelledby="ai-page-guide-heading"
		>
			<h2 id="ai-page-guide-heading" className="category-title">
				<i className="fas fa-route" aria-hidden="true" />{" "}
				{french ? "Parcours de ma plateforme IA" : "My AI platform journey"}
			</h2>
			<p
				style={{
					color: "var(--text-secondary)",
					lineHeight: 1.65,
					marginBottom: "1.25rem",
				}}
			>
				{french
					? "La page suit désormais les couches de la plateforme, des agents jusqu’à la gouvernance. Utilisez ce parcours pour accéder directement à une responsabilité de l’architecture."
					: "The page now follows the platform layers from agents through governance. Use this journey to jump directly to an architectural responsibility."}
			</p>
			<nav
				className="resource-grid"
				aria-label={
					french ? "Navigation de la plateforme IA" : "AI platform navigation"
				}
			>
				{sections.map((section, index) => (
					<a
						key={section.id}
						href={`#${section.id}`}
						className="resource-card text-decoration-none"
						style={{ display: "block" }}
					>
						<h3>
							<i
								className={`fas ${section.icon} resource-card-icon`}
								aria-hidden="true"
							/>{" "}
							{index + 1}. {french ? section.fr : section.en}
						</h3>
					</a>
				))}
			</nav>
		</section>,
		mountPoint,
	);
}
