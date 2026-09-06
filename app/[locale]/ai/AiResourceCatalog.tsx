import { useTranslations } from "next-intl";
import styles from "./AiNativePage.module.css";

const RESOURCES = [
	{ id: "nemotron", name: "NVIDIA Nemotron", href: "https://developer.nvidia.com/nemotron", linkKey: "learnMore" },
	{ id: "context7", name: "Context7", href: "https://context7.com/", linkKey: "website" },
	{ id: "mcpServers", name: "Awesome MCP Servers", href: "https://github.com/punkpeye/awesome-mcp-servers", linkKey: "repository" },
] as const;

const GROUPS = [
	{ id: "providers", items: ["OpenAI", "Groq", "Cohere", "Anthropic", "Google Gemini", "Mistral AI", "Azure OpenAI", "Open WebUI", "LocalAI"] },
	{ id: "coding", items: ["GitHub Copilot", "Cursor", "Amazon Q Developer", "Dust"] },
	{ id: "cloud", items: ["Azure Machine Learning", "Hugging Face", "AWS SageMaker", "Google Vertex AI"] },
	{ id: "rag", items: ["LangChain", "PGvector", "Elasticsearch"] },
	{ id: "automation", items: ["n8n", "LangGraph", "Zapier", "HubSpot", "CrewAI", "Temporal"] },
	{ id: "evals", items: ["Weights & Biases", "Langfuse", "OpenTelemetry", "Opik"] },
	{ id: "local", items: ["Ollama", "LiteLLM", "vLLM", "llama.cpp", "LM Studio", "AnythingLLM", "OpenRAG", "Open Terminal"] },
] as const;

export default function AiResourceCatalog() {
	const t = useTranslations("ai");
	return (
		<section id="ai-resource-catalog" className="category-section" aria-labelledby="ai-resource-catalog-heading">
			<h2 id="ai-resource-catalog-heading" className="category-title"><i className="fas fa-microchip" aria-hidden="true" /> {t("resourceCatalog.title")}</h2>
			<p className={styles.sectionLead}>{t("resourceCatalog.lead")}</p>
			<h3>{t("resourceCatalog.modelsTitle")}</h3>
			<div className="resource-grid">
				{RESOURCES.map((resource) => (
					<article className="resource-card" key={resource.id}>
						<h3>{resource.name}</h3>
						<p>{t(`resourceCatalog.${resource.id}`)}</p>
						<a href={resource.href} target="_blank" rel="noopener noreferrer" className="resource-link">{t(`resourceCatalog.${resource.linkKey}`)}</a>
					</article>
				))}
				<article className="resource-card">
					<h3>{t("resourceCatalog.learningTitle")}</h3>
					<p>{t("resourceCatalog.learning")}</p>
					<a href="https://newsletter.maartengrootendorst.com/p/a-visual-guide-to-reasoning-llms" target="_blank" rel="noopener noreferrer" className="resource-link">{t("resourceCatalog.article")}</a>
				</article>
			</div>
			<h3 className={styles.subheading}>{t("resourceCatalog.ecosystemTitle")}</h3>
			<p>{t("resourceCatalog.compass")}</p>
			<div className={styles.ecosystemGrid}>
				{GROUPS.map((group) => (
					<article className="resource-card" key={group.id}>
						<h3>{t(`resourceCatalog.groups.${group.id}`)}</h3>
						<ul className={styles.tagList}>{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
					</article>
				))}
			</div>
		</section>
	);
}
