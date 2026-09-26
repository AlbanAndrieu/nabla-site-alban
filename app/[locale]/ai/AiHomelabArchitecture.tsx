import { useTranslations } from "next-intl";
import { AI_ENTITIES } from "../architecture/architectureData";
import styles from "./AiHomelabArchitecture.module.css";

const LAYER_IDS = [
	"interfaces",
	"gateway",
	"inference",
	"tools",
	"workflow",
	"observability",
] as const;

const LAYERS = LAYER_IDS.map((id, index) => ({
	id,
	items: AI_ENTITIES.filter((entity) => entity.layer === index).map(
		(entity) => entity.name,
	),
}));

function ArchitectureFlow() {
	const t = useTranslations("ai");
	return (
		<ol className={styles.flow} aria-label={t("architecture.aria")}>
			{LAYERS.map((layer, index) => (
				<li className={styles.layer} key={layer.id}>
					<div className={styles.layerHeader}>
						<span className={styles.layerNumber} aria-hidden="true">
							{index + 1}
						</span>
						<h3>{t(`architecture.layers.${layer.id}`)}</h3>
					</div>
					<ul className={styles.items}>
						{layer.items.map((item) => (
							<li key={item}>{item}</li>
						))}
					</ul>
				</li>
			))}
		</ol>
	);
}

export default function AiHomelabArchitecture() {
	const t = useTranslations("ai");
	return (
		<section
			id="ai-homelab-architecture"
			className="category-section"
			aria-labelledby="ai-homelab-heading"
		>
			<h2 id="ai-homelab-heading" className="category-title">
				<i className="fas fa-network-wired" aria-hidden="true" />{" "}
				{t("architecture.title")}
			</h2>
			<p className={styles.intro}>{t("architecture.intro")}</p>
			<ArchitectureFlow />
			<div className="resource-grid">
				<article className="resource-card">
					<h3>{t("architecture.privacyTitle")}</h3>
					<p>{t("architecture.privacyCopy")}</p>
				</article>
				<article className="resource-card">
					<h3>{t("architecture.costTitle")}</h3>
					<p>{t("architecture.costCopy")}</p>
				</article>
				<article className="resource-card">
					<h3>{t("architecture.measurableTitle")}</h3>
					<p>{t("architecture.measurableCopy")}</p>
				</article>
			</div>
		</section>
	);
}
