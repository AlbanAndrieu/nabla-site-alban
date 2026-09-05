"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./AiHomelabArchitecture.module.css";

const LAYERS = [
	{
		id: "interfaces",
		items: ["Open WebUI", "OpenClaw", "OpenCode / Codex / Cursor"],
	},
	{
		id: "gateway",
		items: [
			"LiteLLM",
			"Redis cache",
			"routing · budgets · fallbacks · telemetry",
		],
	},
	{ id: "inference", items: ["Ollama · local", "OpenAI API · remote"] },
	{
		id: "tools",
		items: ["FastAPI MCP", "Open Terminal", "OpenRAG", "SearXNG", "Paperless"],
	},
	{ id: "workflow", items: ["n8n", "Temporal", "Langflow"] },
	{ id: "observability", items: ["Langfuse", "Opik", "Prometheus"] },
] as const;

function ArchitectureFlow() {
	const t = useTranslations("ai");
	return (
		<ol className={styles.flow} aria-label={t("architecture.aria")}>
			{LAYERS.map((layer, index) => (
				<li className={styles.layer} key={layer.id}>
					<div className={styles.layerHeader}>
						<span className={styles.layerNumber} aria-hidden="true">
							{index + 1}
						</span>
						<h3>{t(`architecture.layers.${layer.id}`)}</h3>
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

export default function AiHomelabArchitecture() {
	const t = useTranslations("ai");
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
				{t("architecture.title")}
			</h2>
			<p className={styles.intro}>{t("architecture.intro")}</p>
			<ArchitectureFlow />
			<div className="resource-grid">
				<article className="resource-card">
					<h3>
						<i
							className="fas fa-user-shield resource-card-icon"
							aria-hidden="true"
						/>{" "}
						{t("architecture.privacyTitle")}
					</h3>
					<p>{t("architecture.privacyCopy")}</p>
				</article>
				<article className="resource-card">
					<h3>
						<i className="fas fa-coins resource-card-icon" aria-hidden="true" />{" "}
						{t("architecture.costTitle")}
					</h3>
					<p>{t("architecture.costCopy")}</p>
				</article>
				<article className="resource-card">
					<h3>
						<i
							className="fas fa-chart-line resource-card-icon"
							aria-hidden="true"
						/>{" "}
						{t("architecture.measurableTitle")}
					</h3>
					<p>{t("architecture.measurableCopy")}</p>
				</article>
			</div>
		</section>,
		mountPoint,
	);
}
