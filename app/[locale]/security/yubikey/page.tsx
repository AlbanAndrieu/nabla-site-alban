import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import TopAnchor from "@/components/TopAnchor";
import Container from "@/components/ui/Container";
import { type AppLocale, routing } from "@/i18n/routing";
import {
	canonicalPageAlternates,
	canonicalPagePath,
} from "@/lib/sitePageCatalog";
import { enrichPageMetadata } from "@/lib/socialMetadata";
import { GUIDE_COPY } from "./content";
import styles from "./page.module.css";
import YubiKeyGraph from "./YubiKeyGraph";
import YubiKeyUseCases from "./YubiKeyUseCases";

export async function generateMetadata({
	params,
}: PageProps<"/[locale]/security/yubikey">): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};
	const copy = GUIDE_COPY[locale as AppLocale];
	return enrichPageMetadata(
		{
			title: copy.meta.title,
			description: copy.meta.description,
			alternates: {
				canonical: canonicalPagePath("security/yubikey", locale as AppLocale),
				languages: canonicalPageAlternates("security/yubikey"),
			},
		},
		{ slug: "security/yubikey", locale },
	);
}

export default async function YubiKeySecurityPage({
	params,
}: PageProps<"/[locale]/security/yubikey">) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();
	setRequestLocale(locale);
	const copy = GUIDE_COPY[locale as AppLocale];
	return (
		<div className="site-content-page page-security page-dark">
			<TopAnchor />
			<header className={styles.hero}>
				<Container>
					<a
						href={canonicalPagePath("security", locale as AppLocale)}
						className={styles.backLink}
					>
						<i className="fa-solid fa-arrow-left" aria-hidden="true" />{" "}
						{copy.back}
					</a>
					<p className={styles.eyebrow}>{copy.eyebrow}</p>
					<h1>{copy.title}</h1>
					<p className={styles.lead}>{copy.lead}</p>
				</Container>
			</header>
			<main id="main-content">
				<Container>
					<p className={styles.disclaimer} role="note">
						{copy.disclaimer}
					</p>
					<nav
						className={styles.toc}
						aria-label={locale === "fr" ? "Sommaire" : "On this page"}
					>
						<a href="#yubikey-graph-title">{copy.diagramTitle}</a>
						<a href="#yubikey-workflow">{copy.workflowTitle}</a>
						<a href="#yubikey-use-cases">
							{locale === "fr" ? "Exemples" : "Examples"}
						</a>
						<a href="#yubikey-safety">{copy.safetyTitle}</a>
						<a href="#yubikey-glossary">{copy.glossaryTitle}</a>
						<a href="#yubikey-next">{copy.nextTitle}</a>
					</nav>
					<YubiKeyGraph copy={copy} />
					<section id="yubikey-workflow" className={styles.section}>
						<h2>{copy.workflowTitle}</h2>
						<div className={styles.stepGrid}>
							{copy.steps.map((step, index) => (
								<article className={styles.step} key={step.title}>
									<div className={styles.stepHead}>
										<span className={styles.stepNumber}>
											{String(index + 1).padStart(2, "0")}
										</span>
										<span className={styles.state} data-status={step.state}>
											{copy.stateLabels[step.state]}
										</span>
									</div>
									<h3>{step.title}</h3>
									<p>{step.text}</p>
								</article>
							))}
						</div>
					</section>
					<YubiKeyUseCases locale={locale as AppLocale} />
					<section id="yubikey-safety" className={styles.section}>
						<h2>{copy.safetyTitle}</h2>
						<ul className={styles.safetyList}>
							{copy.safety.map((item) => (
								<li key={item}>{item}</li>
							))}
						</ul>
					</section>
					<section id="yubikey-glossary" className={styles.section}>
						<h2>{copy.glossaryTitle}</h2>
						<p>{copy.glossaryLead}</p>
						<div className={styles.glossary}>
							{copy.terms.map((term) => (
								<article key={term.acronym} className={styles.glossaryTerm}>
									<h3>
										<abbr title={term.expansion}>{term.acronym}</abbr>
									</h3>
									<p className={styles.expansion}>{term.expansion}</p>
									<p>{term.meaning}</p>
								</article>
							))}
						</div>
						<p className={styles.moreLink}>
							<a
								href={canonicalPagePath(
									"security/lexique",
									locale as AppLocale,
								)}
							>
								{copy.glossaryLink}
							</a>
						</p>
					</section>
					<section id="yubikey-next" className={styles.section}>
						<h2>{copy.nextTitle}</h2>
						<ol className={styles.nextList}>
							{copy.nextSteps.map((item) => (
								<li key={item}>{item}</li>
							))}
						</ol>
						<p className={styles.sources}>
							{copy.sourceLabel}:{" "}
							<a
								href="https://docs.yubico.com/"
								target="_blank"
								rel="noopener noreferrer"
							>
								Yubico
							</a>
							{" · "}
							<a
								href="https://fidoalliance.org/fido2/"
								target="_blank"
								rel="noopener noreferrer"
							>
								FIDO Alliance
							</a>
							{" · "}
							<a
								href="https://age-encryption.org/"
								target="_blank"
								rel="noopener noreferrer"
							>
								age
							</a>
						</p>
					</section>
				</Container>
			</main>
		</div>
	);
}
