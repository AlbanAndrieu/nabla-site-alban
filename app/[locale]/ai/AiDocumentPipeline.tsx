import { useTranslations } from "next-intl";
import styles from "./AiNativePage.module.css";

const STAGES = [
	{ id: "stirling", name: "Stirling PDF", href: "https://github.com/Stirling-Tools/Stirling-PDF" },
	{ id: "paperless", name: "Paperless-ngx", href: "https://docs.paperless-ngx.com/" },
	{ id: "paperlessAi", name: "Paperless-AI", href: "https://github.com/clusterzx/paperless-ai" },
	{ id: "temporal", name: "Temporal", href: "https://temporal.io/" },
	{ id: "anythingllm", name: "AnythingLLM", href: "https://anythingllm.com/" },
	{ id: "openrag", name: "OpenRAG", href: "https://github.com/langflow-ai/openrag" },
] as const;

export default function AiDocumentPipeline() {
	const t = useTranslations("ai");
	return (
		<section id="document-pipeline" className="category-section" aria-labelledby="document-pipeline-heading">
			<h2 id="document-pipeline-heading" className="category-title"><i className="fas fa-file-lines" aria-hidden="true" /> {t("documentPipeline.title")}</h2>
			<p className={styles.sectionLead}>{t("documentPipeline.intro")}</p>
			<ol className={styles.pipeline}>
				{STAGES.map((stage, index) => (
					<li key={stage.id} className="resource-card">
						<span className={styles.stageNumber} aria-hidden="true">{index + 1}</span>
						<div><h3>{stage.name}</h3><p>{t(`documentPipeline.stages.${stage.id}`)}</p><a href={stage.href} target="_blank" rel="noopener noreferrer" className="resource-link">{stage.name}</a></div>
					</li>
				))}
			</ol>
		</section>
	);
}
