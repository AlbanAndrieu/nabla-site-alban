export default function AiWorkflowAutomation({ locale }: { locale: string }) {
	const french = locale === "fr";

	return (
		<section id="workflow-automation-ai-tools" className="category-section" aria-labelledby="workflow-automation-heading">
			<h2 id="workflow-automation-heading" className="category-title">
				<i className="fas fa-robot" aria-hidden="true" /> {french ? "Workflow & orchestration" : "Workflow & orchestration"}
			</h2>
			<div className="resource-grid">
				<article className="resource-card">
					<h3><i className="fas fa-project-diagram resource-card-icon" aria-hidden="true" /> n8n</h3>
					<p>{french ? "Automatisation visuelle pour composer rapidement des intégrations, traitements de données et workflows IA autour des services du homelab." : "Visual automation for rapidly composing integrations, data processing, and AI workflows around homelab services."}</p>
					<a href="https://n8n.io/" target="_blank" rel="noopener noreferrer" className="resource-link"><i className="fas fa-external-link-alt" aria-hidden="true" /> n8n</a>
				</article>
				<article id="temporal" className="resource-card">
					<h3><i className="fas fa-clock resource-card-icon" aria-hidden="true" /> Temporal</h3>
					<p>{french ? "Orchestrateur durable pour les workflows longs, stateful et critiques. Temporal complète n8n lorsque l’exécution doit survivre aux redémarrages, retries et défaillances de services." : "Durable orchestration for long-running, stateful, and critical workflows. Temporal complements n8n when execution must survive restarts, retries, and service failures."}</p>
					<a href="https://temporal.io/" target="_blank" rel="noopener noreferrer" className="resource-link"><i className="fas fa-external-link-alt" aria-hidden="true" /> Temporal</a>
				</article>
			</div>
		</section>
	);
}
