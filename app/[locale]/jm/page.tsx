import type { Metadata } from "next";
import Link from "next/link";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { canonicalPagePath } from "@/lib/sitePageCatalog";

export const dynamic = "force-static";

export async function generateMetadata({
	params,
}: PageProps<"/[locale]/jm">): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};
	const t = await getTranslations({ locale, namespace: "jm" });

	return {
		title: t("pageTitle"),
		description: t("metadataDescription"),
		alternates: {
			canonical: canonicalPagePath("jm", locale),
			languages: {
				en: canonicalPagePath("jm", "en"),
				fr: canonicalPagePath("jm", "fr"),
			},
		},
	};
}

// Correction Next.js 15: params is Promise
export default async function JusmundiPage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);
	const [jm, site] = await Promise.all([
		getTranslations("jm"),
		getTranslations("site"),
	]);
	const kpis = [
		["kpiTasksCompleted", "kpiLabels.tasksCompleted"],
		["kpiPlatformUptime", "kpiLabels.platformUptime"],
		["kpiSecurityBreaches", "kpiLabels.securityBreaches"],
		["kpiMttrP1", "kpiLabels.mttrP1"],
		["kpiAlertNoiseReduction", "kpiLabels.alertNoiseReduction"],
		["kpiAnnualSavings", "kpiLabels.annualSavings"],
	] as const;

	return (
		<>
			<link rel="stylesheet" href="/jm/jusmundi.css" precedence="page" />
			<div className="jusmundi-page jusmundi-landing-page page-dark">
				<span id="top" />
				<a href="#main-content" className="skip-link">
					{site("skipToMainContent")}
				</a>
				<main id="main-content" className="container py-4 pb-5">
					<section
						className="hero-section jusmundi-hero-compact"
						aria-labelledby="hero-heading"
					>
						<div className="hero-content">
							<h1 className="hero-title" id="hero-heading">
								{jm("heroTitle")}
							</h1>
							<p className="hero-subtitle">{jm("heroSubtitle")}</p>
						</div>
					</section>
					<section
						className="proof-section jusmundi-landing-content jusmundi-kpi-section"
						aria-labelledby="kpis-heading"
					>
						<h2 className="section-title" id="kpis-heading">
							{jm("kpisHeading")}
						</h2>
						<p className="section-subtitle">{jm("kpisSubtitle")}</p>
						<div className="kpi-grid">
							{kpis.map(([valueKey, labelKey]) => (
								<div className="kpi-card" key={valueKey}>
									<span className="value">{jm(valueKey)}</span>
									<span className="label">{jm(labelKey)}</span>
								</div>
							))}
						</div>
					</section>

					{/* Security Band */}
					<section
						className="infra-migration-band"
						aria-labelledby="security-focus-highlight-heading"
					>
						<div className="infra-migration-band-layout">
							<div className="infra-migration-band-figure" aria-hidden="true">
								<i className="fas fa-shield-halved" />
							</div>
							<div className="engagement-block infra-migration-band-body">
								<p className="infra-top-achievement-pill">
									<i className="fas fa-trophy" aria-hidden="true" />
									<span>{jm("topAchievement", { rank: 1 })}</span>
								</p>
								<h3 id="security-focus-highlight-heading">
									{jm("securityBandHeading")}
								</h3>
								<p className="infra-migration-lead">{jm("securityBandLead")}</p>
								<ul>
									{jm.raw("securityBand").map((entry: string) => (
										<li key={entry}>{entry}</li>
									))}
								</ul>
							</div>
						</div>
					</section>

					{/* K8s/Infra Band */}
					<section
						className="infra-migration-band infra-migration-band--k8s"
						aria-labelledby="infra-k8s-us-heading"
					>
						<div className="infra-migration-band-layout">
							<div className="infra-migration-band-figure" aria-hidden="true">
								<i className="fas fa-network-wired" />
							</div>
							<div className="engagement-block infra-migration-band-body">
								<p className="infra-top-achievement-pill">
									<i className="fas fa-trophy" aria-hidden="true" />
									<span>{jm("topAchievement", { rank: 2 })}</span>
								</p>
								<h3 id="infra-k8s-us-heading">{jm("infraBandHeading")}</h3>
								<p className="infra-migration-lead">{jm("infraBandLead")}</p>
								<ul>
									{jm.raw("infraBand").map((entry: string) => (
										<li key={entry}>{entry}</li>
									))}
								</ul>
							</div>
						</div>
					</section>

					{/* AI Band */}
					<section
						className="infra-migration-band infra-migration-band--ai"
						aria-labelledby="ai-company-transition-heading"
					>
						<div className="infra-migration-band-layout">
							<div className="infra-migration-band-figure" aria-hidden="true">
								<i className="fas fa-brain" />
							</div>
							<div className="engagement-block infra-migration-band-body">
								<p className="infra-top-achievement-pill">
									<i className="fas fa-trophy" aria-hidden="true" />
									<span>{jm("topAchievement", { rank: 3 })}</span>
								</p>
								<h3 id="ai-company-transition-heading">
									{jm("aiBandHeading")}
								</h3>
								<p className="infra-migration-lead">{jm("aiBandLead")}</p>
								<ul>
									{jm.raw("aiBand").map((entry: string) => (
										<li key={entry}>{entry}</li>
									))}
								</ul>
							</div>
						</div>
					</section>

					{/* Achievements by Area */}
					<section
						className="services-section jusmundi-landing-content"
						aria-labelledby="achievements-heading"
					>
						<h2 className="section-title" id="achievements-heading">
							{jm("achievementsHeading")}
						</h2>
						<p className="section-subtitle">{jm("achievementsSubtitle")}</p>
						<div className="services-grid jusmundi-achievements-by-area-grid">
							{/* SEO Card */}
							<div className="service-card">
								<div className="service-icon" aria-hidden="true">
									<i className="fas fa-search"></i>
								</div>
								<h3 id="seo-heading">{jm("achievements.seo.title")}</h3>
								<p className="service-lead">{jm("achievements.seo.lead")}</p>
								<ul className="service-bullets">
									{jm.raw("achievements.seo.bullets").map((entry: string) => (
										<li key={entry}>{entry}</li>
									))}
								</ul>
							</div>
							{/* SLA Card */}
							<div className="service-card">
								<div className="service-icon" aria-hidden="true">
									<i className="fas fa-chart-line"></i>
								</div>
								<h3 id="sla-heading">{jm("achievements.sla.title")}</h3>
								<p className="service-lead">{jm("achievements.sla.lead")}</p>
								<ul className="service-bullets">
									{jm.raw("achievements.sla.bullets").map((entry: string) => (
										<li key={entry}>{entry}</li>
									))}
								</ul>
							</div>
							{/* Security & Compliance Card */}
							<div className="service-card">
								<div className="service-icon" aria-hidden="true">
									<i className="fas fa-shield-halved"></i>
								</div>
								<h3 id="security-heading">
									{jm("achievements.security.title")}
								</h3>
								<p className="service-lead">
									{jm("achievements.security.lead")}
								</p>
								<div className="badge-row">
									{jm
										.raw("achievements.security.badges")
										.map((badge: string) => (
											<span className="badge" key={badge}>
												{badge}
											</span>
										))}
								</div>
								<h4 className="jusmundi-card-h4">
									{jm("achievements.security.vulnTitle")}
								</h4>
								<ul className="service-bullets">
									{jm
										.raw("achievements.security.vulnBullets")
										.map((entry: string) => (
											<li key={entry}>{entry}</li>
										))}
								</ul>
								<h4 className="jusmundi-card-h4">
									{jm("achievements.security.idpTitle")}
								</h4>
								<ul className="service-bullets">
									{jm
										.raw("achievements.security.idpBullets")
										.map((entry: string) => (
											<li key={entry}>{entry}</li>
										))}
								</ul>
								<h4 className="jusmundi-card-h4">
									{jm("achievements.security.complianceTitle")}
								</h4>
								<ul className="service-bullets">
									{jm
										.raw("achievements.security.complianceBullets")
										.map((entry: string) => (
											<li key={entry}>{entry}</li>
										))}
								</ul>
							</div>
							{/* Platform Card */}
							<div className="service-card">
								<div className="service-icon" aria-hidden="true">
									<i className="fas fa-server"></i>
								</div>
								<h3 id="other-heading">{jm("achievements.platform.title")}</h3>
								<p className="service-lead">
									{jm("achievements.platform.lead")}
								</p>
								<ul className="service-bullets">
									{jm
										.raw("achievements.platform.bullets")
										.map((entry: string) => (
											<li key={entry}>{entry}</li>
										))}
								</ul>
							</div>
						</div>
					</section>

					{/* Overall estimate section */}
					<section
						className="proof-section jusmundi-landing-content"
						aria-labelledby="overall-heading"
					>
						<h2 className="section-title" id="overall-heading">
							{jm("overallHeading")}
						</h2>
						<div className="service-card jusmundi-service-card-wide">
							<ul>
								{jm.raw("overallBullets").map((entry: string) => (
									<li key={entry}>{entry}</li>
								))}
							</ul>
						</div>
					</section>

					{/* Related documents section */}
					<section
						className="proof-section jusmundi-landing-content"
						aria-labelledby="documents-heading"
					>
						<h2 className="section-title" id="documents-heading">
							{jm("relatedDocumentsHeading")}
						</h2>
						<p className="section-subtitle">{jm("relatedDocumentsSubtitle")}</p>
						<div className="services-grid">
							{jm
								.raw("relatedDocuments")
								.map(
									(doc: {
										title: string;
										link: string;
										description: string;
										iconClass: string;
										externalLink?: { label: string; href: string };
									}) => (
										<article
											className="service-card jusmundi-doc-card position-relative"
											key={doc.link}
										>
											<div className="service-icon" aria-hidden="true">
												<i className={doc.iconClass}></i>
											</div>
											<h3>
												<Link
													href={doc.link}
													className="stretched-link text-decoration-none"
												>
													{doc.title}
												</Link>
											</h3>
											<p className="service-lead">
												{doc.description}
												{doc.externalLink && (
													<>
														({" "}
														<a
															href={doc.externalLink.href}
															target="_blank"
															rel="noopener noreferrer"
															className="jusconnect-product-link"
														>
															{doc.externalLink.label}
															<i
																className="fas fa-up-right-from-square ms-1"
																aria-hidden="true"
															></i>
															<span className="visually-hidden">
																{" "}
																(opens in new tab)
															</span>
														</a>{" "}
														)
													</>
												)}
											</p>
										</article>
									),
								)}
						</div>
					</section>
				</main>
			</div>
		</>
	);
}
