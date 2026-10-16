import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import TopAnchor from "@/components/TopAnchor";
import Container from "@/components/ui/Container";
import ExternalLink from "@/components/ui/ExternalLink";
import { type AppLocale, routing } from "@/i18n/routing";
import {
	canonicalPageAlternates,
	canonicalPagePath,
} from "@/lib/sitePageCatalog";
import { enrichPageMetadata } from "@/lib/socialMetadata";
import {
	GLOSSARY_CATEGORIES,
	type GlossarySource,
	glossaryCategoryAnchor,
	glossaryTermAnchor,
} from "./glossary";
import styles from "./page.module.css";

type GlossaryTermCopy = {
	acronym: string;
	expansion: string;
	question: string;
	definition: string[];
	points?: string[];
	note?: string;
};

type GlossaryCategoryCopy = {
	title: string;
	intro?: string;
	outro?: string;
	terms: Record<string, GlossaryTermCopy>;
};

export async function generateMetadata({
	params,
}: PageProps<"/[locale]/security/lexique">): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};
	const t = await getTranslations({
		locale,
		namespace: "securityGlossaryPage.meta",
	});
	const metadata: Metadata = {
		title: t("title"),
		description: t("description"),
		alternates: {
			canonical: canonicalPagePath("security/lexique", locale),
			languages: canonicalPageAlternates("security/lexique"),
		},
	};
	return enrichPageMetadata(metadata, { slug: "security/lexique", locale });
}

export default async function SecurityGlossaryPage({
	params,
}: PageProps<"/[locale]/security/lexique">) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();
	setRequestLocale(locale);

	const t = await getTranslations({
		locale,
		namespace: "securityGlossaryPage",
	});
	const categoryCopy = t.raw("categories") as Record<
		string,
		GlossaryCategoryCopy
	>;
	const categories = GLOSSARY_CATEGORIES.map((category) => {
		const copy = categoryCopy[category.id];
		return {
			...category,
			copy,
			terms: category.terms.map((term) => ({
				id: term.id,
				sources: ("sources" in term
					? term.sources
					: []) as readonly GlossarySource[],
				copy: copy.terms[term.id],
			})),
		};
	});

	return (
		<div className="site-content-page page-security page-dark">
			<TopAnchor />
			<header className={styles.hero}>
				<Container>
					<a
						className={styles.backLink}
						href={canonicalPagePath("security", locale as AppLocale)}
					>
						<i className="fa-solid fa-arrow-left" aria-hidden="true" />{" "}
						{t("backToSecurity")}
					</a>
					<p className={styles.eyebrow}>{t("eyebrow")}</p>
					<h1>{t("title")}</h1>
					<p className={styles.lead}>{t("lead")}</p>
				</Container>
			</header>

			<main id="main-content">
				<Container>
					<nav className={styles.toc} aria-label={t("toc.label")}>
						<ul>
							<li>
								<a href="#glossary-overview">{t("toc.overview")}</a>
							</li>
							{categories.map((category) => (
								<li key={category.id}>
									<a href={`#${glossaryCategoryAnchor(category.id)}`}>
										{category.copy.title}
									</a>
								</li>
							))}
						</ul>
					</nav>

					<section
						className={styles.overview}
						aria-labelledby="glossary-overview"
					>
						<h2 id="glossary-overview">{t("overview.title")}</h2>
						{/* biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must be keyboard reachable */}
						<div
							className={styles.tableScroll}
							role="region"
							aria-label={t("overview.scrollLabel")}
							tabIndex={0}
						>
							<table className={styles.table}>
								<caption className={styles.visuallyHidden}>
									{t("overview.caption")}
								</caption>
								<thead>
									<tr>
										<th scope="col">{t("overview.acronym")}</th>
										<th scope="col">{t("overview.meaning")}</th>
										<th scope="col">{t("overview.question")}</th>
									</tr>
								</thead>
								<tbody>
									{categories.flatMap((category) =>
										category.terms.map((term) => (
											<tr key={term.id}>
												<th scope="row">
													<a href={`#${glossaryTermAnchor(term.id)}`}>
														{term.copy.acronym}
													</a>
												</th>
												<td>{term.copy.expansion}</td>
												<td>{term.copy.question}</td>
											</tr>
										)),
									)}
								</tbody>
							</table>
						</div>
					</section>

					{categories.map((category) => {
						const headingId = glossaryCategoryAnchor(category.id);
						return (
							<section
								key={category.id}
								className={styles.category}
								aria-labelledby={headingId}
							>
								<h2 id={headingId}>
									<i className={category.iconClass} aria-hidden="true" />{" "}
									{category.copy.title}
								</h2>
								{category.copy.intro ? (
									<p className={styles.callout}>{category.copy.intro}</p>
								) : null}
								<div className={styles.termGrid}>
									{category.terms.map((term) => (
										<article
											key={term.id}
											id={glossaryTermAnchor(term.id)}
											className={styles.term}
											aria-labelledby={`${glossaryTermAnchor(term.id)}-title`}
										>
											<h3 id={`${glossaryTermAnchor(term.id)}-title`}>
												<abbr title={term.copy.expansion}>
													{term.copy.acronym}
												</abbr>{" "}
												<span className={styles.expansion}>
													· {term.copy.expansion}
												</span>
											</h3>
											<p className={styles.question}>
												<span>{t("keyQuestion")}</span> {term.copy.question}
											</p>
											{term.copy.definition.map((paragraph) => (
												<p key={paragraph}>{paragraph}</p>
											))}
											{term.copy.points ? (
												<ul>
													{term.copy.points.map((point) => (
														<li key={point}>{point}</li>
													))}
												</ul>
											) : null}
											{term.copy.note ? (
												<p className={styles.note}>{term.copy.note}</p>
											) : null}
											{term.sources.length > 0 ? (
												<p className={styles.sources}>
													<span>{t("sourcesLabel")}</span>{" "}
													{term.sources.map((source, index) => (
														<span key={source.href}>
															{index > 0 ? " · " : null}
															<ExternalLink href={source.href}>
																{source.label}
															</ExternalLink>
														</span>
													))}
												</p>
											) : null}
										</article>
									))}
								</div>
								{category.copy.outro ? (
									<p className={styles.callout}>{category.copy.outro}</p>
								) : null}
							</section>
						);
					})}

					<p className={styles.disclaimer}>{t("disclaimer")}</p>
				</Container>
			</main>
		</div>
	);
}
