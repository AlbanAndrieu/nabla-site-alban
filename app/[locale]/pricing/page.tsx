import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import TopAnchor from "@/components/TopAnchor";
import { routing } from "@/i18n/routing";
import { paymentLocale } from "@/lib/paymentPages";
import { NON_INDEXABLE_ROBOTS } from "@/lib/sitePageCatalog";

type Props = { params: Promise<{ locale: string }> };

const content = {
	en: {
		title: "Consulting pricing & engagement options",
		intro:
			"I work with startups and scale-ups through retainers, focused audits, or milestone-based delivery. Prices are confirmed after a short scoping call and exclude VAT where applicable.",
		howTitle: "How pricing works",
		how: [
			"Day-based — fractional and advisory work is quoted in person-days or as a monthly retainer.",
			"Fixed sprint — bounded audits and deliverables can use a fixed fee after discovery.",
			"Expenses — cloud spend, travel, and third-party tools require prior agreement and are billed at cost.",
		],
		addonsTitle: "Optional services",
		addons: [
			"Evening or weekend critical work by prior agreement.",
			"On-call coverage priced separately from advisory days.",
			"Half-day or full-day training and workshops.",
		],
		nextTitle: "Next step",
		next: "Book a free 30-minute consultation to check fit and receive a written estimate.",
		book: "Book an intro call",
		services: "Back to services",
	},
	fr: {
		title: "Tarifs et modes d’engagement",
		intro:
			"J’accompagne les startups et scale-ups sous forme de mandat récurrent, d’audit ciblé ou de livraison par jalons. Les tarifs sont confirmés après un bref cadrage et s’entendent hors TVA lorsqu’elle s’applique.",
		howTitle: "Fonctionnement des tarifs",
		how: [
			"À la journée — les missions fractionnées et de conseil sont chiffrées en jours-personnes ou en forfait mensuel.",
			"Sprint forfaitaire — un audit ou un livrable bien délimité peut être proposé au forfait après la découverte.",
			"Frais — les dépenses cloud, déplacements et outils tiers sont validés au préalable et facturés au coût réel.",
		],
		addonsTitle: "Services optionnels",
		addons: [
			"Intervention critique le soir ou le week-end sur accord préalable.",
			"Astreinte chiffrée séparément des journées de conseil.",
			"Formations et ateliers d’une demi-journée ou d’une journée.",
		],
		nextTitle: "Prochaine étape",
		next: "Réservez une consultation gratuite de 30 minutes pour valider l’adéquation et recevoir une estimation écrite.",
		book: "Réserver un appel",
		services: "Retour aux services",
	},
} as const;

const tiers = {
	en: [
		{
			id: "fractional",
			icon: "fa-calendar-week",
			title: "Fractional DevSecOps / cloud architect",
			range: "€750–€790 per day, excluding VAT",
			summary:
				"Monthly retainer, typically equivalent to 1–3 days per week, remote-first in EU time zones.",
			bullets: [
				"Architecture reviews, roadmaps, IaC, and delivery pipelines.",
				"Security and compliance alignment: ISO 27001, SOC 2, and GDPR-aware design.",
				"Async support plus agreed working sessions.",
			],
			cta: "Discuss a retainer",
			href: "https://calendly.com/alban-andrieu",
		},
		{
			id: "audit",
			icon: "fa-magnifying-glass-chart",
			title: "Audit & assessment sprint",
			range: "Fixed fee after discovery",
			summary:
				"A focused review with written outcomes, commonly delivered over 2–4 elapsed weeks.",
			bullets: [
				"Cloud, platform, CI/CD, or security posture review.",
				"Findings report, prioritized backlog, and read-out workshop.",
				"Optional fractional or project follow-up.",
			],
			cta: "Request a scope",
			href: "mailto:job@albandrieu.com?subject=Audit%20sprint%20request",
		},
		{
			id: "project",
			icon: "fa-diagram-project",
			title: "Project-based delivery",
			range: "Milestone SOW or capped time and materials",
			summary:
				"Defined outcomes for migrations, platform builds, or compliance initiatives.",
			bullets: [
				"Milestones and acceptance criteria documented up front.",
				"Weekly demos or written progress reports.",
				"Handover documentation and knowledge transfer.",
			],
			cta: "Outline your project",
			href: "mailto:job@albandrieu.com?subject=Project%20SOW%20discussion",
		},
	],
	fr: [
		{
			id: "fractional",
			icon: "fa-calendar-week",
			title: "DevSecOps / architecte cloud fractionné",
			range: "750–790 € par jour, hors TVA",
			summary:
				"Mandat mensuel, généralement équivalent à 1–3 jours par semaine, à distance et sur les fuseaux européens.",
			bullets: [
				"Revues d’architecture, feuille de route, IaC et pipelines.",
				"Alignement sécurité et conformité : ISO 27001, SOC 2 et RGPD.",
				"Support asynchrone et sessions de travail convenues.",
			],
			cta: "Discuter d’un mandat",
			href: "https://calendly.com/alban-andrieu",
		},
		{
			id: "audit",
			icon: "fa-magnifying-glass-chart",
			title: "Sprint d’audit et d’évaluation",
			range: "Forfait après la phase de découverte",
			summary:
				"Une revue ciblée avec livrables écrits, généralement menée sur 2 à 4 semaines calendaires.",
			bullets: [
				"Revue cloud, plateforme, CI/CD ou posture de sécurité.",
				"Rapport, backlog priorisé et atelier de restitution.",
				"Suivi fractionné ou projet en option.",
			],
			cta: "Demander un cadrage",
			href: "mailto:job@albandrieu.com?subject=Demande%20de%20sprint%20audit",
		},
		{
			id: "project",
			icon: "fa-diagram-project",
			title: "Livraison au projet",
			range: "Énoncé des travaux par jalons ou régie plafonnée",
			summary:
				"Résultats définis pour une migration, une plateforme ou une initiative de conformité.",
			bullets: [
				"Jalons et critères d’acceptation définis en amont.",
				"Démonstrations hebdomadaires ou suivi écrit.",
				"Documentation de transfert et partage de connaissances.",
			],
			cta: "Présenter votre projet",
			href: "mailto:job@albandrieu.com?subject=Discussion%20projet",
		},
	],
} as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const locale = paymentLocale((await params).locale);
	return {
		title: `${content[locale].title} — Alban Andrieu`,
		description: content[locale].intro,
		robots: NON_INDEXABLE_ROBOTS,
	};
}

export default async function PricingPage({ params }: Props) {
	const { locale: rawLocale } = await params;
	if (!hasLocale(routing.locales, rawLocale)) notFound();
	const locale = paymentLocale(rawLocale);
	setRequestLocale(locale);
	const copy = content[locale];

	return (
		<div className="site-content-page page-dark">
			<TopAnchor />
			<a href="#main-content" className="skip-to-main">
				{locale === "fr"
					? "Aller au contenu principal"
					: "Skip to main content"}
			</a>
			<main id="main-content" className="container py-4 pb-5 pricing-page">
				<header className="mb-4">
					<h1 className="h2 mb-2">{copy.title}</h1>
					<p className="lead text-secondary mb-0">{copy.intro}</p>
				</header>
				<section className="py-3" aria-labelledby="how-pricing-works">
					<h2 id="how-pricing-works" className="h4 mb-3">
						{copy.howTitle}
					</h2>
					<ul>
						{copy.how.map((item) => (
							<li key={item}>{item}</li>
						))}
					</ul>
				</section>
				<section
					className="py-3"
					aria-label={
						locale === "fr" ? "Modes d’engagement" : "Engagement tiers"
					}
				>
					<div className="pricing-tier-grid">
						{tiers[locale].map((tier) => (
							<article
								className="pricing-tier-card card h-100 bg-body-secondary border-secondary"
								id={tier.id}
								key={tier.id}
							>
								<div className="card-body d-flex flex-column">
									<h2 className="h5 card-title">
										<i
											className={`fas ${tier.icon} text-primary`}
											aria-hidden="true"
										/>{" "}
										{tier.title}
									</h2>
									<p className="pricing-tier-range">
										<strong>{tier.range}</strong>
									</p>
									<p className="card-text text-secondary small mb-2">
										{tier.summary}
									</p>
									<ul className="small mb-3 flex-grow-1">
										{tier.bullets.map((item) => (
											<li key={item}>{item}</li>
										))}
									</ul>
									<a
										href={tier.href}
										className="btn btn-outline-primary btn-sm"
									>
										{tier.cta}
									</a>
								</div>
							</article>
						))}
					</div>
				</section>
				<section className="py-3" aria-labelledby="addons-heading">
					<h2 id="addons-heading" className="h4 mb-3">
						{copy.addonsTitle}
					</h2>
					<div className="card border-secondary bg-body-secondary">
						<div className="card-body">
							<ul className="mb-0">
								{copy.addons.map((item) => (
									<li key={item}>{item}</li>
								))}
							</ul>
						</div>
					</div>
				</section>
				<section className="py-3" aria-labelledby="pricing-next-step">
					<h2 id="pricing-next-step" className="h4 mb-3">
						{copy.nextTitle}
					</h2>
					<p>{copy.next}</p>
					<div className="d-flex flex-wrap gap-2">
						<a
							href="https://calendly.com/alban-andrieu"
							className="btn btn-primary"
							target="_blank"
							rel="noopener noreferrer"
						>
							{copy.book}
						</a>
						<a
							href={`/${locale}/expertise#services`}
							className="btn btn-outline-secondary"
						>
							{copy.services}
						</a>
					</div>
				</section>
			</main>
		</div>
	);
}
