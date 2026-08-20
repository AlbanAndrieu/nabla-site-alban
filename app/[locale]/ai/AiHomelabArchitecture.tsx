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
  OW --> LLM[LiteLLM gateway]
  LLM --> OL[Ollama - local models]
  LLM --> OAI[OpenAI - remote models]
  OW --> OT[Open Terminal]
  OW --> SX[SearXNG]
  OW --> MCP[FastAPI MCP]
  MCP --> TOOLS[MCP tools & APIs]
  OT --> HOST[Homelab execution environment]
  SX --> WEB[Web sources]
  MCP --> SEC[Controlled service integrations]

  subgraph Homelab[Self-hosted AI homelab]
    OW
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
					? "Open WebUI est mon interface IA centrale. LiteLLM fournit une passerelle unique vers Ollama pour les modèles locaux et OpenAI pour les modèles distants. Open WebUI utilise aussi Open Terminal pour l’exécution contrôlée de commandes, SearXNG pour la recherche Web et mon service FastAPI MCP pour les outils et intégrations Model Context Protocol."
					: "Open WebUI is my central AI interface. LiteLLM provides one gateway to Ollama for local models and OpenAI for remote models. Open WebUI also uses Open Terminal for controlled command execution, SearXNG for web search, and my FastAPI MCP service for Model Context Protocol tools and integrations."}
			</p>
			<div className="resource-card overflow-auto" aria-label={french ? "Diagramme de l’architecture IA" : "AI architecture diagram"}>
				<pre className="mermaid ai-homelab-mermaid">{diagram}</pre>
			</div>
			<p style={{ marginTop: "1.5rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
				{french
					? "Cette séparation conserve Open WebUI comme point d’entrée, LiteLLM comme couche de routage des modèles, et isole la recherche, l’exécution système et les outils MCP pour faciliter maintenance, observabilité et contrôle de sécurité."
					: "This separation keeps Open WebUI as the entry point, LiteLLM as the model-routing layer, and isolates search, system execution, and MCP tooling for easier maintenance, observability, and security control."}
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
