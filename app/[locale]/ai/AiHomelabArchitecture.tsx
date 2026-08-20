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

const diagram = `flowchart TB
  U([User])

  subgraph Interfaces[1 · AI interfaces & autonomous agents]
    direction LR
    OW[Open WebUI<br/>deployed]
    OC[OpenClaw<br/>agent automation]
    CODE[OpenCode / Codex / Cursor<br/>coding agents]
  end

  subgraph Control[2 · AI gateway & model control plane]
    direction LR
    LLM{{LiteLLM<br/>routing · fallbacks · budgets<br/>privacy · telemetry}}
    REDIS[(Redis<br/>LLM cache)]
  end

  subgraph Models[Inference providers]
    direction LR
    OL[Ollama<br/>Qwen 3 · Llama 3 · Gemma 3<br/>LOCAL]
    OAI[OpenAI API<br/>REMOTE]
  end

  subgraph Knowledge[3 · Tools, MCP & knowledge]
    direction LR
    MCP[FastAPI MCP]
    OT[Open Terminal]
    RAG[OpenRAG]
    SX[SearXNG]
    PAPER[Paperless<br/>OCR · archive]
  end

  subgraph Workflows[4 · Workflow & orchestration]
    direction LR
    N8N[n8n]
    TEMP[Temporal]
    LANGFLOW[Langflow]
  end

  subgraph Observe[5 · Observability, evaluation & FinOps]
    direction LR
    LF[Langfuse<br/>traces · prompts · cost]
    OPIK[Opik<br/>evaluation]
    PROM[Prometheus<br/>metrics]
  end

  subgraph Resources[Homelab resources]
    direction LR
    HOST[Controlled execution]
    KB[(Indexed knowledge)]
    WEB[Web sources]
  end

  U --> OW
  U --> OC
  U --> CODE
  OW --> LLM
  OC --> LLM
  CODE --> LLM

  LLM <--> REDIS
  LLM -->|local-first| OL
  LLM -->|complex / remote| OAI

  OW --> MCP
  OW --> RAG
  OW --> SX
  OW --> OT
  PAPER --> RAG
  RAG --> KB
  SX --> WEB
  OT --> HOST

  N8N --> MCP
  TEMP --> MCP
  LANGFLOW --> LLM

  LLM -.-> LF
  LLM -.-> PROM
  MCP -.-> LF
  LF -.-> OPIK

  classDef interface fill:#eef6ff,stroke:#2563eb,stroke-width:2px,color:#172033;
  classDef control fill:#fff7df,stroke:#d97706,stroke-width:3px,color:#172033;
  classDef local fill:#eaf8ef,stroke:#16803a,stroke-width:2px,color:#172033;
  classDef remote fill:#f5edff,stroke:#7c3aed,stroke-width:2px,color:#172033;
  classDef capability fill:#f7f7f8,stroke:#64748b,stroke-width:1.5px,color:#172033;
  classDef observe fill:#fff1f2,stroke:#e11d48,stroke-width:2px,color:#172033;

  class OW,OC,CODE interface;
  class LLM,REDIS control;
  class OL local;
  class OAI remote;
  class LF,OPIK,PROM observe;
  class MCP,OT,RAG,SX,PAPER,N8N,TEMP,LANGFLOW,HOST,KB,WEB capability;`;

function renderMermaid() {
	if (!window.mermaid) return;
	window.mermaid.initialize({
		startOnLoad: false,
		securityLevel: "strict",
		theme: "base",
		flowchart: { curve: "basis", htmlLabels: true, nodeSpacing: 36, rankSpacing: 52, useMaxWidth: true },
		themeVariables: {
			fontFamily: "inherit",
			fontSize: "15px",
			lineColor: document.documentElement.dataset.theme === "dark" ? "#94a3b8" : "#64748b",
			clusterBkg: document.documentElement.dataset.theme === "dark" ? "#151b26" : "#ffffff",
			clusterBorder: document.documentElement.dataset.theme === "dark" ? "#475569" : "#cbd5e1",
			primaryTextColor: document.documentElement.dataset.theme === "dark" ? "#f8fafc" : "#172033",
		},
	});
	void window.mermaid.run({ querySelector: ".ai-homelab-mermaid" });
}

const layerStyle = { marginBottom: "1.5rem" };

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
		window.addEventListener("themechange", renderMermaid);
		return () => { window.removeEventListener("themechange", renderMermaid); host.remove(); };
	}, []);

	if (!mountPoint) return null;

	return createPortal(
		<section className="category-section" aria-labelledby="ai-homelab-heading">
			<h2 id="ai-homelab-heading" className="category-title"><i className="fas fa-network-wired" aria-hidden="true" /> {french ? "Architecture de ma plateforme IA" : "My AI platform architecture"}</h2>
			<p style={{ marginBottom: "1.5rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
				{french ? "Une plateforme local-first structurée en couches plutôt qu’en catalogue de produits. LiteLLM constitue le plan de contrôle central entre interfaces, modèles, outils, workflows et observabilité." : "A local-first platform structured as layers rather than a product catalogue. LiteLLM is the central control plane connecting interfaces, models, tools, workflows, and observability."}
			</p>

			<div className="resource-grid" style={layerStyle}>
				<article className="resource-card"><h3>1 · {french ? "Interfaces & agents" : "Interfaces & agents"}</h3><p>{french ? "Open WebUI fournit l’interface conversationnelle ; OpenClaw et les agents de code complètent la couche autonome sans imposer un fournisseur de modèle." : "Open WebUI provides the conversational interface; OpenClaw and coding agents add autonomous capabilities without binding the platform to one model provider."}</p></article>
				<article className="resource-card"><h3>2 · {french ? "Gateway & modèles" : "Gateway & models"}</h3><p>{french ? "LiteLLM centralise routage, fallbacks, budgets, cache Redis et télémétrie. Ollama exécute actuellement Qwen 3, Llama 3 et Gemma 3 localement ; les API distantes restent disponibles pour les besoins plus complexes." : "LiteLLM centralizes routing, fallbacks, budgets, Redis caching, and telemetry. Ollama currently runs Qwen 3, Llama 3, and Gemma 3 locally; remote APIs remain available for more demanding workloads."}</p></article>
				<article className="resource-card"><h3>3 · {french ? "Outils, MCP & connaissance" : "Tools, MCP & knowledge"}</h3><p>{french ? "FastAPI MCP expose les outils ; Open Terminal contrôle l’exécution ; OpenRAG et Paperless construisent la connaissance documentaire ; SearXNG apporte la recherche Web." : "FastAPI MCP exposes tools; Open Terminal controls execution; OpenRAG and Paperless build document knowledge; SearXNG provides web search."}</p></article>
				<article className="resource-card"><h3>4 · {french ? "Workflow & orchestration" : "Workflow & orchestration"}</h3><p>{french ? "n8n compose rapidement les intégrations, Temporal sécurise les traitements stateful et durables, et Langflow complète l’expérimentation de flux IA." : "n8n rapidly composes integrations, Temporal handles durable stateful processing, and Langflow complements AI-flow experimentation."}</p></article>
				<article className="resource-card"><h3>5 · {french ? "Observabilité, évaluation & FinOps" : "Observability, evaluation & FinOps"}</h3><p>{french ? "Langfuse centralise traces, prompts, latence et coûts ; Opik couvre l’évaluation ; Prometheus reçoit les métriques opérationnelles de LiteLLM et de la plateforme." : "Langfuse centralizes traces, prompts, latency, and cost; Opik covers evaluation; Prometheus receives operational metrics from LiteLLM and the platform."}</p></article>
			</div>

			<div className="resource-card overflow-auto ai-architecture-diagram" aria-label={french ? "Diagramme en couches de la plateforme IA" : "Layered AI platform architecture diagram"}><pre className="mermaid ai-homelab-mermaid">{diagram}</pre></div>

			<div className="resource-grid" style={{ marginTop: "1.5rem" }}>
				<article className="resource-card"><h3><i className="fas fa-user-shield resource-card-icon" aria-hidden="true" /> {french ? "Local-first & confidentialité" : "Local-first & privacy"}</h3><p>{french ? "Les charges courantes privilégient Ollama dans le homelab. Le passage par LiteLLM permet de garder une politique commune de routage et de protection avant tout recours à une inférence distante." : "Routine workloads prefer Ollama inside the homelab. Routing through LiteLLM keeps one shared routing and protection policy before any remote inference."}</p></article>
				<article className="resource-card"><h3><i className="fas fa-coins resource-card-icon" aria-hidden="true" /> {french ? "Coût & résilience" : "Cost & resilience"}</h3><p>{french ? "Le cache Redis, les fallbacks et le routage centralisé réduisent les appels distants inutiles et évitent de coupler les clients à un modèle unique." : "Redis caching, fallbacks, and centralized routing reduce unnecessary remote calls and avoid coupling clients to a single model."}</p></article>
				<article className="resource-card"><h3><i className="fas fa-chart-line resource-card-icon" aria-hidden="true" /> {french ? "Mesurable" : "Measurable"}</h3><p>{french ? "Langfuse, Opik et Prometheus séparent l’observabilité LLM, l’évaluation de qualité et les métriques opérationnelles tout en conservant une vue cohérente de la plateforme." : "Langfuse, Opik, and Prometheus separate LLM observability, quality evaluation, and operational metrics while preserving a coherent platform view."}</p></article>
			</div>

			<Script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js" strategy="afterInteractive" onLoad={renderMermaid} />
		</section>,
		mountPoint,
	);
}
