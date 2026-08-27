export default function AiWorkflowAutomation({ locale }: { locale: string }) {
	const french = locale === "fr";
	return (
		<section
			id="workflow-automation"
			className="category-section"
			aria-labelledby="workflow-automation-heading"
		>
			<h2 id="workflow-automation-heading" className="category-title">
				<i className="fas fa-diagram-project" aria-hidden="true" /> Workflow
				&amp; orchestration
			</h2>
			<p
				style={{
					marginBottom: "1.5rem",
					color: "var(--text-secondary)",
					lineHeight: 1.65,
				}}
			>
				{french
					? "Trois rôles complémentaires : n8n pour composer rapidement les automatisations, Temporal pour garantir l’exécution durable et Langflow pour expérimenter et assembler des flux IA."
					: "Three complementary roles: n8n for rapidly composing automations, Temporal for durable execution, and Langflow for experimenting with and assembling AI flows."}
			</p>
			<div className="resource-grid">
				<article className="resource-card">
					<h3>
						<i
							className="fas fa-project-diagram resource-card-icon"
							aria-hidden="true"
						/>{" "}
						n8n
					</h3>
					<p>
						{french
							? "Couche d’automatisation visuelle pour connecter rapidement APIs, données, agents et services du homelab."
							: "Visual automation layer for rapidly connecting APIs, data, agents, and homelab services."}
					</p>
					<a
						href="https://n8n.io/"
						target="_blank"
						rel="noopener noreferrer"
						className="resource-link"
					>
						n8n
					</a>
				</article>
				<article id="temporal" className="resource-card">
					<h3>
						<i className="fas fa-clock resource-card-icon" aria-hidden="true" />{" "}
						Temporal
					</h3>
					<p>
						{french
							? "Couche d’orchestration durable pour les workflows stateful, longs et critiques : retries, état persistant, timers, étapes human-in-the-loop et activités LLM."
							: "Durable orchestration for stateful, long-running, critical workflows: retries, persistent state, timers, human-in-the-loop steps, and LLM activities."}
					</p>
					<a
						href="https://temporal.io/"
						target="_blank"
						rel="noopener noreferrer"
						className="resource-link"
					>
						Temporal
					</a>
				</article>
				<article className="resource-card">
					<h3>
						<i
							className="fas fa-bezier-curve resource-card-icon"
							aria-hidden="true"
						/>{" "}
						Langflow
					</h3>
					<p>
						{french
							? "Atelier visuel pour prototyper des chaînes LLM, agents, outils et RAG avant leur industrialisation dans les couches d’orchestration et de services."
							: "Visual workbench for prototyping LLM chains, agents, tools, and RAG before productionizing them in orchestration and service layers."}
					</p>
					<a
						href="https://www.langflow.org/"
						target="_blank"
						rel="noopener noreferrer"
						className="resource-link"
					>
						Langflow
					</a>
				</article>
			</div>
			<article className="intro-section" style={{ marginTop: "1.25rem" }}>
				<h3 className="intro-section__heading">
					<i className="fab fa-git-alt" aria-hidden="true" /> OpenCommit
				</h3>
				<p>
					{french
						? "OpenCommit complète le workflow de développement avec des messages Conventional Commits cohérents ; il reste volontairement hors de la couche d’orchestration."
						: "OpenCommit complements the development workflow with consistent Conventional Commit messages; it intentionally remains outside the orchestration layer."}
				</p>
				<a
					href="https://github.com/di-sukharev/opencommit"
					target="_blank"
					rel="noopener noreferrer"
					className="resource-link"
				>
					<i className="fab fa-github" aria-hidden="true" /> GitHub
				</a>
			</article>
		</section>
	);
}
