import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import TopAnchor from "@/components/TopAnchor";
import Container from "@/components/ui/Container";
import ExternalLink from "@/components/ui/ExternalLink";
import { type AppLocale, routing } from "@/i18n/routing";
import { DSOMM_SNAPSHOT, dsommSnapshotStats } from "@/lib/dsommSnapshot";
import { localizeDsommSnapshot } from "@/lib/dsommTranslation";
import {
	canonicalPageAlternates,
	canonicalPagePath,
} from "@/lib/sitePageCatalog";
import { enrichPageMetadata } from "@/lib/socialMetadata";
import DsommAssessmentHeatmap, {
	type DsommAssessmentHeatmapCopy,
} from "./DsommAssessmentHeatmap";
import DsommExplorer, { type DsommExplorerCopy } from "./DsommExplorer";
import styles from "./page.module.css";

export async function generateMetadata({
	params,
}: PageProps<"/[locale]/security/dsomm">): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};
	const t = await getTranslations({ locale, namespace: "dsommPage.meta" });
	const metadata: Metadata = {
		title: t("title"),
		description: t("description"),
		alternates: {
			canonical: canonicalPagePath("security/dsomm", locale),
			languages: canonicalPageAlternates("security/dsomm"),
		},
	};
	return enrichPageMetadata(metadata, {
		slug: "security/dsomm",
		locale,
	});
}

export default async function DsommPage({
	params,
}: PageProps<"/[locale]/security/dsomm">) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();
	setRequestLocale(locale);

	const t = await getTranslations({ locale, namespace: "dsommPage" });
	const stats = dsommSnapshotStats();
	const localizedSnapshot = localizeDsommSnapshot(locale as AppLocale);
	const assessmentCopy = t.raw("assessment") as DsommAssessmentHeatmapCopy;
	const explorerCopy = t.raw("explorer") as DsommExplorerCopy;

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
					<div className={styles.heroMeta}>
						<span>{t("snapshotBadge")}</span>
						<span>v{DSOMM_SNAPSHOT.source.version}</span>
						<span>{DSOMM_SNAPSHOT.source.released}</span>
					</div>
				</Container>
			</header>

			<main id="main-content">
				<section
					className={styles.summarySection}
					aria-labelledby="dsomm-summary-heading"
				>
					<Container>
						<h2 id="dsomm-summary-heading" className={styles.visuallyHidden}>
							{t("summary.levelDistribution")}
						</h2>
						<div className={styles.summaryGrid}>
							<article>
								<strong>{stats.activityCount}</strong>
								<span>{t("summary.activities")}</span>
							</article>
							<article>
								<strong>{stats.dimensionCount}</strong>
								<span>{t("summary.dimensions")}</span>
							</article>
							<article>
								<strong>{stats.levels.length}</strong>
								<span>{t("summary.maturityLevels")}</span>
							</article>
							<article>
								<strong>v{DSOMM_SNAPSHOT.source.version}</strong>
								<span>{t("summary.upstreamVersion")}</span>
							</article>
						</div>

						<div className={styles.coverageGrid}>
							<section className={styles.levels}>
								<h3>{t("summary.levelDistribution")}</h3>
								{stats.levels.map(({ level, count }) => (
									<div className={styles.levelRow} key={level}>
										<span>Level {level}</span>
										<progress max={stats.activityCount} value={count}>
											{count}
										</progress>
										<strong>{count}</strong>
									</div>
								))}
							</section>

							<section className={styles.dimensions}>
								<h3>{t("summary.dimensionCoverage")}</h3>
								{stats.dimensions.map(({ dimension, activityCount }) => (
									<div className={styles.dimensionRow} key={dimension}>
										<span>{localizedSnapshot.dimensionLabels[dimension]}</span>
										<progress
											max={stats.maxDimensionActivityCount}
											value={activityCount}
										>
											{activityCount}
										</progress>
										<strong>{activityCount}</strong>
									</div>
								))}
							</section>
						</div>
					</Container>
				</section>

				<Container>
					<DsommAssessmentHeatmap
						copy={assessmentCopy}
						dimensionLabels={localizedSnapshot.dimensionLabels}
						locale={locale as AppLocale}
					/>
					<DsommExplorer
						activities={localizedSnapshot.activities}
						dimensions={localizedSnapshot.dimensions}
						copy={explorerCopy}
					/>
				</Container>

				<section
					className={styles.sourceSection}
					aria-labelledby="dsomm-source-heading"
				>
					<Container>
						<h2 id="dsomm-source-heading">{t("source.title")}</h2>
						<p>{t("source.lead")}</p>
						<dl className={styles.sourceGrid}>
							<div>
								<dt>{t("source.version")}</dt>
								<dd>v{DSOMM_SNAPSHOT.source.version}</dd>
							</div>
							<div>
								<dt>{t("source.released")}</dt>
								<dd>{DSOMM_SNAPSHOT.source.released}</dd>
							</div>
							<div>
								<dt>{t("source.snapshot")}</dt>
								<dd>{DSOMM_SNAPSHOT.source.snapshotDate}</dd>
							</div>
							<div>
								<dt>Git</dt>
								<dd>
									<code>{DSOMM_SNAPSHOT.source.sourceCommit.slice(0, 12)}</code>
								</dd>
							</div>
						</dl>
						<div className={styles.sourceLinks}>
							<ExternalLink href={DSOMM_SNAPSHOT.source.upstreamUrl}>
								{t("source.source")}
							</ExternalLink>
							<ExternalLink href={DSOMM_SNAPSHOT.source.projectUrl}>
								{t("source.project")}
							</ExternalLink>
							<ExternalLink href={DSOMM_SNAPSHOT.source.licenseUrl}>
								{t("source.license")}: {DSOMM_SNAPSHOT.source.license}
							</ExternalLink>
						</div>
					</Container>
				</section>
			</main>
		</div>
	);
}
