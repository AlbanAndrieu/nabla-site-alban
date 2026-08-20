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

  subgraph Clients[AI interfaces & autonomous agents]
    direction LR
    OW[Open WebUI<br/>Chat & orchestration]
    OC[OpenClaw<br/>Personal automation]
    CODE[OpenCode<br/>Autonomous coding]
  end

  subgraph Control[Model control plane]
    LLM{{LiteLLM<br/>routing · budgets · observability<br/>LLM Guard · PII}}
  end

  subgraph Models[Inference]
    direction LR
    OL[Ollama<br/>Qwen 2.5<br/>LOCAL]
    OAI[OpenAI API<br/>Advanced reasoning<br/>REMOTE]
  end

  subgraph Capabilities[Shared tools & capabilities]
    direction LR
    MAIL[Email]
    CAL[Calendar]
    OT[Open Terminal]
    RAG[OpenRAG]
    SX[SearXNG]
    MCP[FastAPI MCP]
    REPO[Git repositories]
  end

  subgraph Observability[LLM observability]
    LF[Langfuse<br/>traces · prompts · costs · latency]
  end

  subgraph Documents[Document pipeline]
    direction LR
    PDF[PDF documents]
    PAPER[Paperless tools<br/>OCR · classify · archive]
  end

  subgraph Resources[Controlled resources]
    direction LR
    HOST[Homelab execution]
    KB[Indexed knowledge]
    WEB[Web sources]
    TOOLS[MCP tools & APIs]
  end

  U --> OW
  U --> OC
  U --> CODE

  OW --> LLM
  OC --> LLM
  CODE --> LLM

  LLM -->|privacy · low cost| OL
  LLM -->|PII filtered · complex reasoning| OAI
  LLM -.->|traces & usage| LF

  OC --> MAIL
  OC --> CAL
  CODE --> REPO
  OW --> OT
  OW --> RAG
  OW --> SX
  OW --> MCP

  MCP -.->|tool traces| LF
  PDF --> PAPER
  PAPER -->|processed PDFs| RAG
  RAG --> KB
  OT --> HOST
  SX --> WEB
  MCP --> TOOLS

  classDef client fill:#eef6ff,stroke:#2563eb,stroke-width:2px,color:#172033;
  classDef gateway fill:#fff7df,stroke:#d97706,stroke-width:3px,color:#172033;
  classDef local fill:#eaf8ef,stroke:#16803a,stroke-width:2px,color:#172033;
  classDef remote fill:#f5edff,stroke:#7c3aed,stroke-width:2px,color:#172033;
  classDef capability fill:#f7f7f8,stroke:#64748b,stroke-width:1.5px,color:#172033;
  classDef observability fill:#fff1f2,stroke:#e11d48,stroke-width:2px,color:#172033;

  class OW,OC,CODE client;
  class LLM gateway;
  class OL local;
  class OAI remote;
  class LF observability;
  class MAIL,CAL,OT,RAG,SX,MCP,REPO,PDF,PAPER,HOST,KB,WEB,TOOLS capability;`;

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
		return () => { window.removeEventListener("themechange", renderMermaid); host.remove(); };
	}, []);

	if (!mountPoint) return null;

	return createPortal(
		<section className="category-section" aria-labelledby="ai-homelab-heading">
			<h2 id="ai-homelab-heading" className="category-title"><i className="fas fa-network-wired" aria-hidden="true" /> {french ? "Ma plateforme IA" : "My AI platform"}</h2>
			<p style={{ marginBottom: "1.5rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
				{french ? "Une architecture local-first organisée par responsabilités : interfaces et agents en entrée, LiteLLM comme plan de contrôle commun, modèles locaux ou distants selon le besoin, capacités partagées, observabilité Langfuse et pipeline documentaire Paperless vers OpenRAG." : "A local-first architecture organized by responsibility: interfaces and agents at the edge, LiteLLM as the shared control plane, local or remote models selected by need, shared capabilities, Langfuse observability, and a Paperless-to-OpenRAG document pipeline."}
			</p>
			<div className="resource-grid" style={{ marginBottom: "1.5rem" }}>
				<article className="resource-card">
					<h3><i className="fas fa-user-shield resource-card-icon" aria-hidden="true" /> {french ? "Confidentialité" : "Privacy"}</h3>
					<p>{french ? "Les tâches courantes privilégient Ollama et Qwen 2.5 dans le homelab. LiteLLM utilise également la fonction LLM Guard pour détecter et protéger les PII avant le routage vers les modèles, notamment lorsque l’inférence distante est nécessaire." : "Routine workloads prefer Ollama and Qwen 2.5 inside the homelab. LiteLLM also uses the LLM Guard capability to detect and protect PII before model routing, especially when remote inference is required."}</p>
				</article>
				<article className="resource-card"><h3><i className="fas fa-coins resource-card-icon" aria-hidden="true" /> {french ? "Coût" : "Cost"}</h3><p>{french ? "LiteLLM centralise le routage, les budgets et l’observabilité afin de réserver les API distantes aux tâches qui le justifient." : "LiteLLM centralizes routing, budgets, and observability so remote APIs are reserved for workloads that justify them."}</p></article>
				<article className="resource-card"><h3><i className="fas fa-brain resource-card-icon" aria-hidden="true" /> {french ? "Raisonnement" : "Reasoning"}</h3><p>{french ? "Les demandes complexes peuvent être routées vers l’API OpenAI, sans coupler les agents à un fournisseur unique." : "Complex requests can be routed to the OpenAI API without coupling agents to a single provider."}</p></article>
			</div>
			<div className="resource-card overflow-auto ai-architecture-diagram" aria-label={french ? "Diagramme de la plateforme IA" : "AI platform architecture diagram"}><pre className="mermaid ai-homelab-mermaid">{diagram}</pre></div>
			<p style={{ marginTop: "1.5rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>{french ? "Les PDF transitent par les outils Paperless pour l’OCR, la classification et l’archivage, puis alimentent OpenRAG et la connaissance indexée. LiteLLM conserve le contrôle du routage modèle et applique la protection des PII avant l’inférence distante. Langfuse reçoit les traces de LiteLLM et du serveur MCP afin de centraliser l’observabilité des appels IA et des outils." : "PDFs pass through Paperless tooling for OCR, classification, and archiving, then feed OpenRAG and indexed knowledge. LiteLLM retains model-routing control and applies PII protection before remote inference. Langfuse receives traces from LiteLLM and the MCP server to centralize observability across AI and tool calls."}</p>
			<Script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js" strategy="afterInteractive" onLoad={renderMermaid} />
		</section>,
		mountPoint,
	);
}
