import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import SkipToMainContent from "@/components/SkipToMainContent";
import TopAnchor from "@/components/TopAnchor";
import { routing } from "@/i18n/routing";
import { canonicalPagePath } from "@/lib/sitePageCatalog";
import { enrichPageMetadata, SITE_ORIGIN } from "@/lib/socialMetadata";
import AiNativeSections from "./AiNativeSections";
import AiPageGuide from "./AiPageGuide";
import styles from "./AiNativePage.module.css";

export async function generateMetadata({
	params,
}: PageProps<"/[locale]/ai">): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};
	const t = await getTranslations({ locale, namespace: "ai.meta" });
	const metadata: Metadata = {
		title: t("title"),
		description: t("description"),
		alternates: { canonical: canonicalPagePath("ai", locale) },
	};
	return enrichPageMetadata(metadata, { slug: "ai", locale });
}

export default async function AiBestPracticesPage({
	params,
}: PageProps<"/[locale]/ai">) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();
	setRequestLocale(locale);
	const t = await getTranslations({ locale, namespace: "ai" });
	const canonicalPath = canonicalPagePath("ai", locale);
	const contactPath = canonicalPagePath("contact", locale);
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "Article",
		headline: t("meta.title"),
		description: t("meta.description"),
		author: { "@type": "Person", name: "Alban Andrieu", url: SITE_ORIGIN },
		mainEntityOfPage: new URL(canonicalPath, SITE_ORIGIN).href,
		datePublished: "2026-01-28",
		dateModified: "2026-09-06",
	};

	return (
		<div className="site-content-page page-ai page-dark page-nabla-best-practices">
			<link rel="stylesheet" href="/nabla.css" />
			<TopAnchor />
			<SkipToMainContent />
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
				}}
			/>
			<header>
				<section className="hero-section" id="home" aria-labelledby="ai-hero-heading">
					<div className="hero-content">
						<h1 className="hero-title" id="ai-hero-heading">
							<i className="fas fa-brain" aria-hidden="true" /> {t("hero.title")}
						</h1>
						<p className="hero-subtitle">{t("hero.subtitle")}</p>
						<p className={styles.heroDescription}>{t("hero.description")}</p>
					</div>
				</section>
			</header>
			<main id="main-content" role="main" className={styles.main}>
				<section className="content-section" aria-label={t("intro.aria")}>
					<article id="introduction" className="intro-section">
						<p>{t("intro.first")}</p>
						<p>{t("intro.second")}</p>
					</article>
					<AiPageGuide />
					<AiNativeSections />
					<section id="contact" className="contact-section" aria-labelledby="ai-contact-heading">
						<h2 id="ai-contact-heading">{t("contact.title")}</h2>
						<p>{t("contact.lead")}</p>
						<div className={styles.contactActions}>
							<a className={styles.contactLink} href={contactPath}>{t("contact.contact")}</a>
							<a className={styles.contactLink} href="mailto:job@albandrieu.com">{t("contact.email")}</a>
							<a className={styles.contactLink} href="https://calendly.com/alban-andrieu" target="_blank" rel="noopener noreferrer">{t("contact.calendar")}</a>
						</div>
					</section>
				</section>
			</main>
		</div>
	);
}
