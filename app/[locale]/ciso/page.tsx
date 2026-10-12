import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ThreatFeed from "@/components/ciso/ThreatFeed";
import TopAnchor from "@/components/TopAnchor";
import { type AppLocale, routing } from "@/i18n/routing";
import { canonicalPagePath } from "@/lib/sitePageCatalog";
import { buildPageMetadata } from "@/lib/socialMetadata";

type Props = { params: Promise<{ locale: string }> };

const compliance = [
	["fa-user-shield", "GDPR / RGPD", "95%"],
	["fa-shield-halved", "ISO 27001", "100%"],
	["fa-brain", "ISO 42001", "100%"],
	["fa-clipboard-check", "SOC 2", "In progress"],
	["fa-credit-card", "PCI DSS", "10%"],
] as const;

type MetricItem = readonly [icon: string, label: string, value: string];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};
	const t = await getTranslations({ locale, namespace: "ciso" });
	return buildPageMetadata({
		title: `${t("title")} — Alban Andrieu`,
		description: t("subtitle"),
		slug: "ciso",
		locale,
	});
}

export default async function CisoPage({ params }: Props) {
	const { locale: requestedLocale } = await params;
	if (!hasLocale(routing.locales, requestedLocale)) notFound();
	const locale = requestedLocale as AppLocale;
	setRequestLocale(locale);
	const t = await getTranslations("ciso");
	const metrics = t.raw("metricItems") as MetricItem[];

	return (
		<>
			<TopAnchor />
			<main id="main-content" className="site-content-page page-ciso page-dark">
				<section
					className="hero-section ciso-hero"
					aria-labelledby="ciso-title"
				>
					<div className="hero-content">
						<h1 id="ciso-title" className="hero-title">
							<i className="fa-solid fa-shield-halved" aria-hidden="true" />{" "}
							{t("title")}
						</h1>
						<p className="hero-subtitle">{t("subtitle")}</p>
						<p className="hero-description">
							{t("curatedBy")} <a href={`/${locale}/contact`}>Alban Andrieu</a>
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
							{t("compliance")}
						</h2>
						<p>{t("complianceIntro")}</p>
						<dl className="ciso-compliance-grid">
							{compliance.map(([icon, label, value]) => (
								<div key={label}>
									<dt>
										<i className={`fa-solid ${icon}`} aria-hidden="true" />
										<span>{label}</span>
									</dt>
									<dd>{value === "In progress" ? t("inProgress") : value}</dd>
								</div>
							))}
						</dl>
						<p>{t("audit")}</p>
						<a
							className="resource-link"
							href="https://checklist.albandrieu.com/"
							target="_blank"
							rel="noopener noreferrer"
						>
							{t("checklist")}{" "}
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
							{t("metrics")}
						</h2>
						<div className="ciso-metrics">
							{metrics.map(([icon, label, value]) => (
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
					<section className="ciso-card ciso-card--wide" aria-labelledby="dora-requirements">
						<h2 id="dora-requirements">
							<i className="fa-solid fa-scale-balanced" aria-hidden="true" />{" "}
							DORA — {locale === "fr" ? "Résilience opérationnelle numérique" : "Digital operational resilience"}
						</h2>
						<p>{locale === "fr"
							? "Le règlement (UE) 2022/2554 s’applique depuis le 17 janvier 2025 aux entités financières concernées. Article 10 : détection des activités anormales ; article 13 : apprentissage à partir des incidents et renseignements de cybermenace ; article 45 : cadre du partage volontaire de renseignements."
							: "Regulation (EU) 2022/2554 applies since 17 January 2025 to financial entities in scope. Article 10 addresses detection, Article 13 learning from incidents and cyber-threat intelligence, and Article 45 voluntary cyber-threat information sharing."}
						</p>
						<p>{locale === "fr"
							? "Une veille publique ne démontre pas à elle seule la conformité DORA et ne doit pas exposer les findings techniques internes."
							: "A public digest does not establish DORA compliance and must not disclose internal technical findings."}
						</p>
						<a className="resource-link" href="https://eur-lex.europa.eu/eli/reg/2022/2554/oj" target="_blank" rel="noopener noreferrer">
							{locale === "fr" ? "Consulter DORA sur EUR-Lex" : "Read DORA on EUR-Lex"} ↗
						</a>
					</section>


					<section
						className="ciso-card ciso-card--wide"
						aria-labelledby="threats-heading"
					>
						<h2 id="threats-heading">
							<i className="fa-solid fa-globe" aria-hidden="true" />{" "}
							{t("threats")}
						</h2>
						<p>{t("threatsIntro")}</p>
						<p>
							<a className="resource-link" href={locale === "fr" ? "/fr/ctid" : "/ctid"}>
								{locale === "fr" ? "Dix signaux prioritaires, homelab et global — CTID" : "Top ten homelab and global signals — CTID"}
							</a>
							{" · "}
							<a className="resource-link" href="/security-feed.xml">
								{locale === "fr" ? "Flux RSS sécurité" : "Security RSS"}
							</a>
							{" · "}
							<a className="resource-link" href="/feed.xml">
								{locale === "fr" ? "Flux RSS du site" : "Site RSS"}
							</a>
						</p>
						<ThreatFeed locale={locale} />
					</section>
				</div>
			</main>
		</>
	);
}
