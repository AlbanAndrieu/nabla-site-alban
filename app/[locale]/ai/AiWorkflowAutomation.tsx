"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function AiWorkflowAutomation({ locale }: { locale: string }) {
	const french = locale === "fr";
	const [mountPoint, setMountPoint] = useState<HTMLElement | null>(null);

	useEffect(() => {
		const documentPipeline = document.getElementById("document-pipeline");
		if (!documentPipeline?.parentElement) return;
		const host = document.createElement("div");
		host.className = "ai-workflow-automation-host";
		documentPipeline.insertAdjacentElement("beforebegin", host);
		setMountPoint(host);
		return () => host.remove();
	}, []);

	if (!mountPoint) return null;

	return createPortal(
		<section id="workflow-automation" className="category-section" aria-labelledby="workflow-automation-heading">
			<h2 id="workflow-automation-heading" className="category-title">
				<i className="fas fa-diagram-project" aria-hidden="true" /> Workflow &amp; orchestration
			</h2>
			<p style={{ marginBottom: "1.5rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
				{french
					? "Deux niveaux complémentaires : n8n pour composer rapidement les automatisations et Temporal pour garantir l’exécution durable des traitements longs ou critiques."
					: "Two complementary layers: n8n for rapidly composing automations and Temporal for durable execution of long-running or critical processes."}
			</p>
			<div className="resource-grid">
				<article className="resource-card">
					<h3><i className="fas fa-project-diagram resource-card-icon" aria-hidden="true" /> n8n</h3>
					<p>{french ? "Couche d’automatisation visuelle pour connecter rapidement APIs, données, agents et services du homelab. Idéal pour les intégrations et workflows dont la logique doit rester facile à inspecter et modifier." : "Visual automation layer for rapidly connecting APIs, data, agents, and homelab services. Best suited to integrations and workflows whose logic should remain easy to inspect and change."}</p>
					<a href="https://n8n.io/" target="_blank" rel="noopener noreferrer" className="resource-link"><i className="fas fa-external-link-alt" aria-hidden="true" /> n8n</a>
				</article>
				<article id="temporal" className="resource-card">
					<h3><i className="fas fa-clock resource-card-icon" aria-hidden="true" /> Temporal</h3>
					<p>{french ? "Couche d’orchestration durable pour les workflows stateful, longs et critiques. Temporal prend le relais lorsque retries, reprise après incident et état d’exécution doivent survivre aux redémarrages." : "Durable orchestration layer for stateful, long-running, critical workflows. Temporal takes over when retries, recovery, and execution state must survive restarts and failures."}</p>
					<a href="https://temporal.io/" target="_blank" rel="noopener noreferrer" className="resource-link"><i className="fas fa-external-link-alt" aria-hidden="true" /> Temporal</a>
				</article>
			</div>
			<article className="intro-section" style={{ marginTop: "1.25rem" }}>
				<h3 className="intro-section__heading"><i className="fab fa-git-alt" aria-hidden="true" /> OpenCommit</h3>
				<p>{french ? "OpenCommit complète le workflow de développement en générant des messages Conventional Commits cohérents, sans être présenté comme un orchestrateur au même niveau que n8n ou Temporal." : "OpenCommit complements the development workflow with consistent Conventional Commit messages without being presented as an orchestrator at the same level as n8n or Temporal."}</p>
				<a href="https://github.com/di-sukharev/opencommit" target="_blank" rel="noopener noreferrer" className="resource-link"><i className="fab fa-github" aria-hidden="true" /> GitHub</a>
			</article>
		</section>,
		mountPoint,
	);
}
