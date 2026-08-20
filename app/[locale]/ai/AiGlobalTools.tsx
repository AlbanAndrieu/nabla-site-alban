export default function AiGlobalTools({ locale }: { locale: string }) {
	const french = locale === "fr";
	return (
		<section id="global-ai-tools" className="category-section" aria-labelledby="global-ai-tools-heading">
			<h2 id="global-ai-tools-heading" className="category-title"><i className="fas fa-toolbox" aria-hidden="true" /> {french ? "Composants IA globaux" : "Global AI components"}</h2>
			<p style={{ marginBottom: "1.5rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>{french ? "Capacités partagées et découplées des agents : exécution, connaissance et isolation peuvent être consommées par Open WebUI, les agents et les workflows." : "Shared capabilities decoupled from agents: execution, knowledge, and isolation can be consumed by Open WebUI, agents, and workflows."}</p>
			<div className="resource-grid">
				<article id="open-terminal" className="resource-card"><h3><i className="fas fa-terminal resource-card-icon" aria-hidden="true" /> Open Terminal</h3><p>{french ? "Terminal auto-hébergé exposant une API simple pour permettre aux agents et automatisations d’exécuter des commandes et manipuler des fichiers dans un environnement contrôlé." : "Self-hosted terminal exposing a simple API so agents and automation can execute commands and manipulate files in a controlled environment."}</p><a href="https://github.com/open-webui/open-terminal" target="_blank" rel="noopener noreferrer" className="resource-link"><i className="fab fa-github" aria-hidden="true" /> GitHub</a></article>
				<article id="openrag" className="resource-card"><h3><i className="fas fa-book-open resource-card-icon" aria-hidden="true" /> OpenRAG</h3><p>{french ? "Couche RAG partagée pour indexer et rechercher les documents. Les PDF traités par Paperless alimentent cette connaissance pour les interfaces et agents IA." : "Shared RAG layer for indexing and searching documents. PDFs processed by Paperless feed this knowledge for AI interfaces and agents."}</p></article>
				<article id="nvidia-openshell" className="resource-card"><h3><i className="fas fa-shield-halved resource-card-icon" aria-hidden="true" /> NVIDIA OpenShell</h3><p>{french ? "Runtime sandboxé pour agents autonomes avec isolation, politiques déclaratives et contrôle des accès réseau, fichiers, processus et credentials." : "Sandboxed runtime for autonomous agents with isolation, declarative policies, and controlled network, filesystem, process, and credential access."}</p><a href="https://github.com/NVIDIA/OpenShell" target="_blank" rel="noopener noreferrer" className="resource-link"><i className="fab fa-github" aria-hidden="true" /> GitHub</a></article>
			</div>
		</section>
	);
}
