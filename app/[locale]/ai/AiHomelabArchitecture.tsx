"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

declare global {
	interface Window {
		mermaid?: {
			initialize: (config: Record<string, unknown>) => void;
			run: (options?: { querySelector?: string }) => Promise<void>;
		};
	}
}

const diagram = `flowchart LR
  U[User / Browser] --> OW[Open WebUI]
  U --> OC[OpenClaw]
  U --> CODE[OpenCode]
  OW --> LLM[LiteLLM gateway]
  OC --> LLM
  CODE --> LLM
  LLM --> OL[Ollama - Qwen 2.5 local]
  LLM --> OAI[OpenAI API - complex reasoning]
  OC --> MAIL[Email analysis]
  OC --> CAL[Calendar management]
  CODE --> REPO[Autonomous coding / repositories]
  OW --> OT[Open Terminal]
  OW --> SX[SearXNG]
  OW --> MCP[FastAPI MCP]
  MCP --> TOOLS[MCP tools & APIs]
  OT --> HOST[Homelab execution environment]
  SX --> WEB[Web sources]
  MCP --> SEC[Controlled service integrations]

  subgraph Homelab[Self-hosted AI homelab]
    OW
    OC
    CODE
    LLM
    OL
    OT
    SX
    MCP
    HOST
    TOOLS
    SEC
  end`;

function renderMermaid() {
	if (!window.mermaid) return;
	window.mermaid.initialize({
		startOnLoad: false,
		securityLevel: "strict",
		theme: document.documentElement.dataset.theme === "dark" ? "dark" : "default",
	});
	void window.mermaid.run({ querySelector: ".ai-homelab-mermaid" });
}

export default function AiHomelabArchitecture({ locale }: { locale: string }) {
	const french = locale === "fr";
	const [mountPoint, setMountPoint] = useState<HTMLElement | null>(null);

	useEffect(() => {
		const documentPipeline = document.getElementById("document-pipeline");
		if (!documentPipeline?.parentElement) return;

		const host = document.createElement("div");
		host.className = "ai-homelab-architecture-host";
		documentPipeline.insertAdjacentElement("afterend", host);
		setMountPoint(host);

		window.addEventListener("themechange", renderMermaid);
		return () => {
			window.removeEventListener("themechange", renderMermaid);
			host.remove();
		};
	}, []);

	if (!mountPoint) return null;

	return createPortal(
		<section className="category-section" aria-labelledby="ai-homelab-heading">
			<h2 id="ai-homelab-heading" className="category-title">
				<i className="fas fa-network-wired" aria-hidden="true" /> {french ? "Architecture de mon homelab IA" : "My AI homelab architecture"}
			</h2>
			<p style={{ marginBottom: "1.5rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
				{french
					? "Open WebUI reste mon interface IA centrale. OpenClaw automatise l’analyse des e-mails et la gestion du calendrier, tandis qu’OpenCode exécute des tâches de développement de manière autonome. Ces clients passent par LiteLLM, qui route les requêtes courantes vers Ollama avec Qwen 2.5 en local et les tâches nécessitant un raisonnement plus complexe vers l’API OpenAI. Open WebUI utilise également Open Terminal, SearXNG et mon service FastAPI MCP."
					: "Open WebUI remains my central AI interface. OpenClaw automates email analysis and calendar management, while OpenCode handles autonomous coding tasks. These clients use LiteLLM, which routes routine requests to local Qwen 2.5 through Ollama and tasks requiring more complex reasoning to the OpenAI API. Open WebUI also uses Open Terminal, SearXNG, and my FastAPI MCP service."}
			</p>
			<div className="resource-card overflow-auto" aria-label={french ? "Diagramme de l’architecture IA" : "AI architecture diagram"}>
				<pre className="mermaid ai-homelab-mermaid">{diagram}</pre>
			</div>
			<p style={{ marginTop: "1.5rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
				{french
					? "LiteLLM constitue ainsi le plan de contrôle commun des modèles : priorité à l’inférence locale pour la confidentialité et le coût, avec bascule vers OpenAI lorsque la complexité du raisonnement le justifie. Les interfaces, agents, outils MCP, recherche Web et capacités d’exécution restent découplés pour faciliter maintenance, observabilité et sécurité."
					: "LiteLLM therefore acts as the shared model control plane: local inference is preferred for privacy and cost, with OpenAI used when reasoning complexity warrants it. Interfaces, agents, MCP tools, web search, and execution capabilities remain decoupled for easier maintenance, observability, and security."}
			</p>
			<Script
				src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"
				strategy="afterInteractive"
				onLoad={renderMermaid}
			/>
		</section>,
		mountPoint,
	);
}
