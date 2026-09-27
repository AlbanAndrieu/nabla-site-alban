import { useTranslations } from "next-intl";

const PILLARS = [
	{ id: "gateway", icon: "fas fa-route" },
	{ id: "identity", icon: "fas fa-shield-halved" },
	{ id: "mcp", icon: "fas fa-plug" },
	{ id: "rag", icon: "fas fa-database" },
	{ id: "observability", icon: "fas fa-chart-line" },
	{ id: "governance", icon: "fas fa-scale-balanced" },
] as const;

const OUTCOMES = [
	"privacy",
	"policy",
	"measurement",
	"providers",
	"audit",
] as const;

const GOVERNANCE_CONTROLS = [
	{
		id: "dataProtection",
		frameworks: ["ISO 27001", "ISO 42001", "GDPR"],
	},
	{
		id: "finops",
		frameworks: ["ISO 42001"],
	},
	{
		id: "governance",
		frameworks: ["ISO 27001", "ISO 42001", "GDPR"],
	},
] as const;

export default function AiSecurePlatformOverview() {
	const t = useTranslations("ai");
	return (
		<section
			id="secure-ai-platform"
			className="category-section"
			aria-labelledby="secure-ai-platform-heading"
		>
			<h2 id="secure-ai-platform-heading" className="category-title">
				<i className="fas fa-shield-halved" aria-hidden="true" />{" "}
				{t("securePlatform.title")}
			</h2>
			<p>{t("securePlatform.lead")}</p>
			<h3>{t("securePlatform.principles")}</h3>
			<div className="resource-grid">
				{PILLARS.map((pillar) => (
					<article className="resource-card" key={pillar.id}>
						<h3>
							<i
								className={`${pillar.icon} resource-card-icon`}
								aria-hidden="true"
							/>{" "}
							{t(`securePlatform.pillars.${pillar.id}.title`)}
						</h3>
						<p>{t(`securePlatform.pillars.${pillar.id}.description`)}</p>
					</article>
				))}
			</div>
			<h3>{t("securePlatform.controlsTitle")}</h3>
			<p>{t("securePlatform.controlsLead")}</p>
			<div className="resource-grid">
				{GOVERNANCE_CONTROLS.map((control) => (
					<article
						className="resource-card"
						key={control.id}
						data-ai-control={control.id}
					>
						<h3>{t(`securePlatform.controls.${control.id}.title`)}</h3>
						<p>{t(`securePlatform.controls.${control.id}.description`)}</p>
						<p>
							<strong>{t("securePlatform.evidenceLabel")}:</strong>{" "}
							{t(`securePlatform.controls.${control.id}.evidence`)}
						</p>
						<p>
							<strong>{t("securePlatform.frameworksLabel")}:</strong>{" "}
							{control.frameworks.join(" · ")}
						</p>
					</article>
				))}
			</div>
			<article className="resource-card">
				<h3>{t("securePlatform.outcomesTitle")}</h3>
				<ul>
					{OUTCOMES.map((outcome) => (
						<li key={outcome}>{t(`securePlatform.outcomes.${outcome}`)}</li>
					))}
				</ul>
			</article>
		</section>
	);
}
