import { useTranslations } from "next-intl";
import styles from "./AiNativePage.module.css";

const PRACTICES = ["objective", "measurement", "security", "automation", "change", "testing", "evidence"] as const;

export default function AiEngineeringPractices() {
	const t = useTranslations("ai");
	return (
		<section id="general-best-practices" className="category-section" aria-labelledby="general-best-practices-heading">
			<h2 id="general-best-practices-heading" className="category-title"><i className="fas fa-list-check" aria-hidden="true" /> {t("practices.title")}</h2>
			<p className={styles.sectionLead}>{t("practices.lead")}</p>
			<ul className={styles.practiceList}>{PRACTICES.map((practice) => <li key={practice}>{t(`practices.${practice}`)}</li>)}</ul>
		</section>
	);
}
