"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./AiHomelabArchitecture.module.css";

type ArchitectureLayer = {
	title: string;
	items: string[];
};

const LAYERS: ArchitectureLayer[] = [
	{
		title: "Interfaces & agents",
		items: ["Open WebUI", "OpenClaw", "OpenCode / Codex / Cursor"],
	},
	{
		title: "AI gateway & policy",
		items: ["LiteLLM", "Redis cache", "routing · budgets · fallbacks · telemetry"],
	},
	{
		title: "Inference providers",
		items: ["Ollama · local", "OpenAI API · remote"],
	},
	{
		title: "Tools, MCP & knowledge",
		items: ["FastAPI MCP", "Open Terminal", "OpenRAG", "SearXNG", "Paperless"],
	},
	{
		title: "Workflow & orchestration",
		items: ["n8n", "Temporal", "Langflow"],
	},
	{
		title: "Observability, evaluation & FinOps",
		items: ["Langfuse", "Opik", "Prometheus"],
	},
];

const LAYER_TITLES_FR = [
	"Interfaces et agents",
	"Gateway IA et politiques",
	"Fournisseurs d’inférence",
	"Outils, MCP et connaissance",
	"Workflow et orchestration",
	"Observabilité, évaluation et FinOps",
];

function ArchitectureFlow({ french }: Readonly<{ french: boolean }>) {
	return (
		<ol
			className={styles.flow}
			aria-label={
				french
					? "Flux en couches de la plateforme IA"
					: "Layered AI platform flow"
			}
		>
			{LAYERS.map((layer, index) => (
				<li className={styles.layer} key={layer.title}>
					<div className={styles.layerHeader}>
						<span className={styles.layerNumber} aria-hidden="true">
							{index + 1}
						</span>
						<h3>{french ? LAYER_TITLES_FR[index] : layer.title}</h3>
					</div>
					<ul className={styles.items}>
						{layer.items.map((item) => (
							<li key={item}>{item}</li>
						))}
					</ul>
				</li>
			))}
		</ol>
	);
}

export default function AiHomelabArchitecture({ locale }: { locale: string }) {
	const french = locale === "fr";
	const [mountPoint, setMountPoint] = useState<HTMLElement | null>(null);

	useEffect(() => {
		const documentPipeline = document.getElementById("document-pipeline");
		if (!documentPipeline?.parentElement) return;
		const host = document.createElement("div");
		host.className = "ai-homelab-architecture-host";
		documentPipeline.insertAdjacentElement("beforebegin", host);
		setMountPoint(host);
		return () => host.remove();
	}, []);

	if (!mountPoint) return null;

	return createPortal(
		<section className="category-section" aria-labelledby="ai-homelab-heading">
			<h2 id="ai-homelab-heading" className="category-title">
				<i className="fas fa-network-wired" aria-hidden="true" />{" "}
				{french ? "Architecture de ma plateforme IA" : "My AI platform architecture"}
			</h2>
			<p className={styles.intro}>
				{french
					? "Une plateforme local-first structurée en couches plutôt qu’en catalogue de produits. LiteLLM constitue le plan de contrôle central entre interfaces, modèles, outils, workflows et observabilité."
					: "A local-first platform structured as layers rather than a product catalogue. LiteLLM is the central control plane connecting interfaces, models, tools, workflows, and observability."}
			</p>

			<ArchitectureFlow french={french} />

			<div className="resource-grid">
				<article className="resource-card">
					<h3>
						<i className="fas fa-user-shield resource-card-icon" aria-hidden="true" />{" "}
						{french ? "Local-first et confidentialité" : "Local-first & privacy"}
					</h3>
					<p>
						{french
							? "Les charges courantes privilégient Ollama dans le homelab. Le passage par LiteLLM permet de garder une politique commune de routage et de protection avant tout recours à une inférence distante."
							: "Routine workloads prefer Ollama inside the homelab. Routing through LiteLLM keeps one shared routing and protection policy before any remote inference."}
					</p>
				</article>
				<article className="resource-card">
					<h3>
						<i className="fas fa-coins resource-card-icon" aria-hidden="true" />{" "}
						{french ? "Coût et résilience" : "Cost & resilience"}
					</h3>
					<p>
						{french
							? "Le cache Redis, les fallbacks et le routage centralisé réduisent les appels distants inutiles et évitent de coupler les clients à un modèle unique."
							: "Redis caching, fallbacks, and centralized routing reduce unnecessary remote calls and avoid coupling clients to a single model."}
					</p>
				</article>
				<article className="resource-card">
					<h3>
						<i className="fas fa-chart-line resource-card-icon" aria-hidden="true" />{" "}
						{french ? "Mesurable" : "Measurable"}
					</h3>
					<p>
						{french
							? "Langfuse, Opik et Prometheus séparent l’observabilité LLM, l’évaluation de qualité et les métriques opérationnelles tout en conservant une vue cohérente de la plateforme."
							: "Langfuse, Opik, and Prometheus separate LLM observability, quality evaluation, and operational metrics while preserving a coherent platform view."}
					</p>
				</article>
			</div>
		</section>,
		mountPoint,
	);
}
