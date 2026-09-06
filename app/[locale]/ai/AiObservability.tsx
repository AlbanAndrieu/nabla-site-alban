import { useTranslations } from "next-intl";
import AiUsageAnalytics from "./AiUsageAnalytics";
import styles from "./AiNativePage.module.css";

export default function AiObservability() {
	const t = useTranslations("ai");
	return (
		<section id="ai-observability" className="category-section" aria-labelledby="ai-observability-heading">
			<h2 id="ai-observability-heading" className="category-title">
				<i className="fas fa-chart-line" aria-hidden="true" /> {t("observability.title")}
			</h2>
			<p className={styles.sectionLead}>{t("observability.lead")}</p>
			<div className="resource-grid">
				<article id="opik" className="resource-card"><h3>Opik by Comet</h3><p>{t("observability.opik")}</p><a href="https://www.comet.com/docs/opik/" target="_blank" rel="noopener noreferrer" className="resource-link">{t("observability.documentation")}</a></article>
				<article id="langfuse" className="resource-card"><h3>Langfuse</h3><p>{t("observability.langfuse")}</p><a href="https://langfuse.com/" target="_blank" rel="noopener noreferrer" className="resource-link">Langfuse</a></article>
				<AiUsageAnalytics />
				<article className="resource-card"><h3>Cursor</h3><p>{t("observability.cursor")}</p><a href="https://cursor.com/dashboard/analytics" target="_blank" rel="noopener noreferrer" className="resource-link">{t("observability.cursorAnalytics")}</a></article>
				<article className="resource-card"><h3>LiteLLM</h3><p>{t("observability.litellm")}</p><a href="https://www.litellm.ai/" target="_blank" rel="noopener noreferrer" className="resource-link">LiteLLM</a></article>
			</div>
		</section>
	);
}
