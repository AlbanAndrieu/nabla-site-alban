export default function AiGlobalTools({ locale }: { locale: string }) {
	const french = locale === "fr";

	return (
		<section id="global-ai-tools" className="category-section" aria-labelledby="global-ai-tools-heading">
			<h2 id="global-ai-tools-heading" className="category-title">
				<i className="fas fa-toolbox" aria-hidden="true" /> {french ? "Composants IA globaux" : "Global AI components"}
			</h2>
			<p style={{ marginBottom: "1.5rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
				{french
					? "Ces services sont des capacités partagées de la plateforme : ils ne dépendent pas d’un agent ou d’une interface particulière et peuvent être consommés par Open WebUI, les agents et les workflows."
					: "These services are shared platform capabilities: they are not tied to one agent or interface and can be consumed by Open WebUI, agents, and workflows."}
			</p>
			<div className="resource-grid">
				<article id="open-terminal" className="resource-card">
					<h3><i className="fas fa-terminal resource-card-icon" aria-hidden="true" /> Open Terminal</h3>
					<p>{french ? "Terminal auto-hébergé exposant une API simple pour permettre aux agents et automatisations d’exécuter des commandes et de manipuler des fichiers dans un environnement contrôlé." : "Self-hosted terminal exposing a simple API so agents and automation can execute commands and manipulate files in a controlled environment."}</p>
					<a href="https://github.com/open-webui/open-terminal" target="_blank" rel="noopener noreferrer" className="resource-link"><i className="fab fa-github" aria-hidden="true" /> GitHub</a>
				</article>
				<article id="openrag" className="resource-card">
					<h3><i className="fas fa-book-open resource-card-icon" aria-hidden="true" /> OpenRAG</h3>
					<p>{french ? "Couche RAG partagée pour indexer et rechercher les documents de la plateforme. Les PDF gérés par Paperless alimentent cette base de connaissance afin de rendre les documents exploitables par les interfaces et agents IA." : "Shared RAG layer for indexing and searching platform documents. PDFs managed through Paperless feed this knowledge base so documents can be consumed by AI interfaces and agents."}</p>
				</article>
			</div>
		</section>
	);
}
