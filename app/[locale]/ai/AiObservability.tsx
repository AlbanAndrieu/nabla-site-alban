export default function AiObservability({ locale }: { locale: string }) {
	const french = locale === "fr";

	return (
		<section id="ai-observability" className="category-section" aria-labelledby="ai-observability-heading">
			<h2 id="ai-observability-heading" className="category-title">
				<i className="fas fa-chart-line" aria-hidden="true" /> {french ? "Observabilité & évaluation LLM" : "LLM observability & evaluation"}
			</h2>
			<p style={{ marginBottom: "1.5rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
				{french
					? "Deux outils complémentaires pour tracer, évaluer et surveiller les applications LLM et les services de la plateforme."
					: "Two complementary tools for tracing, evaluating, and monitoring LLM applications and platform services."}
			</p>
			<div className="resource-grid">
				<article id="opik" className="resource-card">
					<h3><i className="fas fa-chart-line resource-card-icon" aria-hidden="true" /> Opik by Comet</h3>
					<p>{french ? "Plateforme open source d’évaluation, de test et de monitoring des applications LLM, utile pour comparer les sorties des modèles et suivre leur qualité en production." : "Open-source platform for evaluating, testing, and monitoring LLM applications, useful for comparing model outputs and tracking production quality."}</p>
					<a href="https://www.comet.com/docs/opik/" target="_blank" rel="noopener noreferrer" className="resource-link"><i className="fas fa-book" aria-hidden="true" /> {french ? "Documentation" : "Documentation"}</a>
				</article>
				<article id="langfuse" className="resource-card">
					<h3><i className="fas fa-eye resource-card-icon" aria-hidden="true" /> Langfuse</h3>
					<p>{french ? "Plateforme open source d’observabilité LLM pour les traces, prompts, scores, coûts et latences. Dans cette architecture, Langfuse collecte notamment la télémétrie de LiteLLM et du serveur MCP afin de fournir une vue transverse des appels IA." : "Open-source LLM observability platform for traces, prompts, scores, costs, and latency. In this architecture, Langfuse collects telemetry from LiteLLM and the MCP server to provide a cross-platform view of AI calls."}</p>
					<a href="https://langfuse.com/" target="_blank" rel="noopener noreferrer" className="resource-link"><i className="fas fa-external-link-alt" aria-hidden="true" /> Langfuse</a>
				</article>
			</div>
		</section>
	);
}
