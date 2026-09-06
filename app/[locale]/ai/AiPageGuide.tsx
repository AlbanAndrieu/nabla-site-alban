import { useTranslations } from "next-intl";
import styles from "./AiNativePage.module.css";

const SECTIONS = [
	{ id: "secure-ai-platform", icon: "fa-shield-halved", key: "secure" },
	{ id: "ai-homelab-architecture", icon: "fa-network-wired", key: "architecture" },
	{ id: "workflow-automation", icon: "fa-diagram-project", key: "automation" },
	{ id: "global-ai-tools", icon: "fa-toolbox", key: "tools" },
	{ id: "ai-resource-catalog", icon: "fa-microchip", key: "catalog" },
	{ id: "ai-observability", icon: "fa-chart-line", key: "observability" },
	{ id: "document-pipeline", icon: "fa-file-lines", key: "knowledge" },
	{ id: "general-best-practices", icon: "fa-list-check", key: "practices" },
] as const;

export default function AiPageGuide() {
	const t = useTranslations("ai");
	return (
		<section className="category-section" aria-labelledby="ai-page-guide-heading">
			<h2 id="ai-page-guide-heading" className="category-title">
				<i className="fas fa-route" aria-hidden="true" /> {t("guide.title")}
			</h2>
			<p className={styles.sectionLead}>{t("guide.lead")}</p>
			<nav className="resource-grid" aria-label={t("guide.aria")}>
				{SECTIONS.map((section, index) => (
					<a key={section.id} href={`#${section.id}`} className={`resource-card text-decoration-none ${styles.guideLink}`}>
						<h3>
							<i className={`fas ${section.icon} resource-card-icon`} aria-hidden="true" />{" "}
							{index + 1}. {t(`guide.sections.${section.key}`)}
						</h3>
					</a>
				))}
			</nav>
		</section>
	);
}
