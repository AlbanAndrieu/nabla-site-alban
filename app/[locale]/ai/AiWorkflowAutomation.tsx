export default function AiWorkflowAutomation({ locale }: { locale: string }) {
	const french = locale === "fr";
	return (
		<section id="workflow-automation-native" className="category-section" aria-labelledby="workflow-automation-heading-native">
			<h2 id="workflow-automation-heading-native" className="category-title"><i className="fas fa-robot" aria-hidden="true" /> Workflow & orchestration</h2>
			<div className="resource-grid">
				<article className="resource-card"><h3><i className="fas fa-project-diagram resource-card-icon" aria-hidden="true" /> n8n</h3><p>{french ? "Automatisation visuelle pour composer rapidement des intégrations, traitements de données et workflows IA autour des services du homelab." : "Visual automation for rapidly composing integrations, data processing, and AI workflows around homelab services."}</p><a href="https://n8n.io/" target="_blank" rel="noopener noreferrer" className="resource-link">n8n</a></article>
				<article id="temporal" className="resource-card"><h3><i className="fas fa-clock resource-card-icon" aria-hidden="true" /> Temporal</h3><p>{french ? "Orchestrateur durable pour les workflows longs, stateful et critiques. Temporal complète n8n lorsque l’exécution doit survivre aux redémarrages, retries et défaillances." : "Durable orchestration for long-running, stateful, critical workflows. Temporal complements n8n when execution must survive restarts, retries, and failures."}</p><a href="https://temporal.io/" target="_blank" rel="noopener noreferrer" className="resource-link">Temporal</a></article>
				<article className="resource-card"><h3><i className="fab fa-git-alt resource-card-icon" aria-hidden="true" /> OpenCommit</h3><p>{french ? "Génération assistée de messages de commit conventionnels pour maintenir une histoire Git lisible et cohérente." : "AI-assisted conventional commit messages for keeping Git history readable and consistent."}</p><a href="https://github.com/di-sukharev/opencommit" target="_blank" rel="noopener noreferrer" className="resource-link"><i className="fab fa-github" aria-hidden="true" /> GitHub</a></article>
			</div>
		</section>
	);
}
