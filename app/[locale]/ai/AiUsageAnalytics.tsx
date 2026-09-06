import { useTranslations } from "next-intl";

export default function AiUsageAnalytics() {
	const t = useTranslations("ai");
	return (
		<article className="resource-card">
			<h3><i className="fas fa-chart-line resource-card-icon" aria-hidden="true" /> {t("usage.title")}</h3>
			<p>{t("usage.description")}</p>
			<a href="https://help.openai.com/en/articles/12289294-global-admin-console" target="_blank" rel="noopener noreferrer" className="resource-link">
				{t("usage.analytics")}
			</a>
		</article>
	);
}
