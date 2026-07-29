import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ThreatFeed from "@/components/ciso/ThreatFeed";
import TopAnchor from "@/components/TopAnchor";
import { type AppLocale, routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

const copy = {
	en: {
		title: "CISO Dashboard",
		subtitle:
			"Threat intelligence, security metrics, and compliance monitoring",
		compliance: "Compliance & risk monitoring",
		complianceIntro:
			"A concise view of the current control and certification posture.",
		audit:
			"Regular reviews keep evidence, risks, and remediation plans current.",
		checklist: "Open the security checklist",
		metrics: "Key security metrics",
		threats: "Threat intelligence",
		threatsIntro:
			"Recent headlines from a small, curated set of established security sources.",
	},
	fr: {
		title: "Tableau de bord RSSI",
		subtitle:
			"Veille sur les menaces, indicateurs de sécurité et suivi de conformité",
		compliance: "Conformité et suivi des risques",
		complianceIntro:
			"Une vue synthétique de la posture actuelle des contrôles et certifications.",
		audit:
			"Des revues régulières maintiennent les preuves, les risques et les plans de remédiation à jour.",
		checklist: "Ouvrir la checklist de sécurité",
		metrics: "Indicateurs clés de sécurité",
		threats: "Veille sur les menaces",
		threatsIntro:
			"Actualités récentes issues d’une sélection limitée de sources de cybersécurité reconnues.",
	},
} as const;

const compliance = [
	["fa-user-shield", "GDPR / RGPD", "95%"],
	["fa-shield-halved", "ISO 27001", "100%"],
	["fa-brain", "ISO 42001", "100%"],
	["fa-clipboard-check", "SOC 2", "In progress"],
	["fa-credit-card", "PCI DSS", "10%"],
] as const;

const metrics = {
	en: [
		["fa-stopwatch", "Incident response time", "15 min"],
		["fa-screwdriver-wrench", "Patching effectiveness", "92%"],
		["fa-gauge-high", "Risk rating", "Medium"],
	],
	fr: [
		["fa-stopwatch", "Temps de réponse aux incidents", "15 min"],
		["fa-screwdriver-wrench", "Efficacité des correctifs", "92%"],
		["fa-gauge-high", "Niveau de risque", "Moyen"],
	],
} as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const locale = (await params).locale === "fr" ? "fr" : "en";
	return {
		title: `${copy[locale].title} — Alban Andrieu`,
		description: copy[locale].subtitle,
	};
}

export default async function CisoPage({ params }: Props) {
	const { locale: requestedLocale } = await params;
	if (!hasLocale(routing.locales, requestedLocale)) notFound();
	const locale = requestedLocale as AppLocale;
	setRequestLocale(locale);
	const site = await getTranslations("site");
	const t = copy[locale];

	return (
		<>
			<TopAnchor />
			<a className="skip-to-main" href="#main-content">
				{site("skipToMainContent")}
			</a>
			<main id="main-content" className="site-content-page page-ciso page-dark">
				<section
					className="hero-section ciso-hero"
					aria-labelledby="ciso-title"
				>
					<div className="hero-content">
						<h1 id="ciso-title" className="hero-title">
							<i className="fa-solid fa-shield-halved" aria-hidden="true" />{" "}
							{t.title}
						</h1>
						<p className="hero-subtitle">{t.subtitle}</p>
						<p className="hero-description">
							{locale === "fr" ? "Une sélection maintenue par " : "Curated by "}
							<a href={`/${locale}/contact`}>Alban Andrieu</a>
						</p>
					</div>
				</section>

				<div className="ciso-content">
					<section
						className="ciso-card ciso-card--wide ciso-card--centered"
						aria-labelledby="compliance-heading"
					>
						<h2 id="compliance-heading">
							<i className="fa-solid fa-certificate" aria-hidden="true" />{" "}
							{t.compliance}
						</h2>
						<p>{t.complianceIntro}</p>
						<dl className="ciso-compliance-grid">
							{compliance.map(([icon, label, value]) => (
								<div key={label}>
									<dt>
										<i className={`fa-solid ${icon}`} aria-hidden="true" />
										<span>{label}</span>
									</dt>
									<dd>
										{value === "In progress" && locale === "fr"
											? "En cours"
											: value}
									</dd>
								</div>
							))}
						</dl>
						<p>{t.audit}</p>
						<a
							className="resource-link"
							href="https://checklist.albandrieu.com/"
							target="_blank"
							rel="noopener noreferrer"
						>
							{t.checklist}{" "}
							<i
								className="fa-solid fa-arrow-up-right-from-square"
								aria-hidden="true"
							/>
						</a>
					</section>

					<section
						className="ciso-card ciso-card--wide ciso-card--centered"
						aria-labelledby="metrics-heading"
					>
						<h2 id="metrics-heading">
							<i className="fa-solid fa-chart-line" aria-hidden="true" />{" "}
							{t.metrics}
						</h2>
						<div className="ciso-metrics">
							{metrics[locale].map(([icon, label, value]) => (
								<article className="ciso-metric" key={label}>
									<i
										className={`fa-solid ${icon} ciso-metric-icon`}
										aria-hidden="true"
									/>
									<h3>{label}</h3>
									<p>{value}</p>
								</article>
							))}
						</div>
					</section>

					<section
						className="ciso-card ciso-card--wide"
						aria-labelledby="threats-heading"
					>
						<h2 id="threats-heading">
							<i className="fa-solid fa-globe" aria-hidden="true" /> {t.threats}
						</h2>
						<p>{t.threatsIntro}</p>
						<ThreatFeed locale={locale} />
					</section>
				</div>
			</main>
		</>
	);
}
