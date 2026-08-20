"use client";

import Script from "next/script";
import { useEffect } from "react";

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
  OW --> LLM[LLM providers / local models]
  OW --> OT[Open Terminal]
  OW --> SX[SearXNG]
  OW --> MCP[FastAPI MCP]
  MCP --> TOOLS[MCP tools & APIs]
  OT --> HOST[Homelab execution environment]
  SX --> WEB[Web sources]
  MCP --> SEC[Controlled service integrations]

  subgraph Homelab[Self-hosted AI homelab]
    OW
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

	useEffect(() => {
		window.addEventListener("themechange", renderMermaid);
		return () => window.removeEventListener("themechange", renderMermaid);
	}, []);

	return (
		<section className="content-section category-section" aria-labelledby="ai-homelab-heading">
			<h2 id="ai-homelab-heading" className="category-title">
				<i className="fas fa-network-wired" aria-hidden="true" /> {french ? "Architecture de mon homelab IA" : "My AI homelab architecture"}
			</h2>
			<p>
				{french
					? "Open WebUI est mon interface IA centrale. Elle orchestre les modèles et services auto-hébergés : Open Terminal pour l’exécution contrôlée de commandes, SearXNG pour la recherche Web et mon service FastAPI MCP pour exposer des outils et intégrations via Model Context Protocol."
					: "Open WebUI is my central AI interface. It orchestrates models and self-hosted services: Open Terminal for controlled command execution, SearXNG for web search, and my FastAPI MCP service for exposing tools and integrations through the Model Context Protocol."}
			</p>
			<div className="resource-card overflow-auto" aria-label={french ? "Diagramme de l’architecture IA" : "AI architecture diagram"}>
				<pre className="mermaid ai-homelab-mermaid">{diagram}</pre>
			</div>
			<p>
				{french
					? "Cette séparation garde Open WebUI comme point d’entrée, tout en isolant la recherche, l’exécution système et les outils MCP afin de faciliter la maintenance, l’observabilité et le contrôle de sécurité."
					: "This separation keeps Open WebUI as the entry point while isolating search, system execution, and MCP tooling for easier maintenance, observability, and security control."}
			</p>
			<Script
				src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"
				strategy="afterInteractive"
				onLoad={renderMermaid}
			/>
		</section>
	);
}
