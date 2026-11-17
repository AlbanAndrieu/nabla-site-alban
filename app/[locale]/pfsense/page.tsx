import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import TopAnchor from "@/components/TopAnchor";
import Container from "@/components/ui/Container";
import layout from "@/components/ui/ContentLayout.module.css";
import ExternalLink from "@/components/ui/ExternalLink";
import { routing } from "@/i18n/routing";
import { NON_INDEXABLE_ROBOTS } from "@/lib/sitePageCatalog";
import styles from "./page.module.css";

const SOURCES = {
	netgate4200Shop: "https://shop.netgate.com/products/4200-pfsense",
	netgate4200Launch: "https://netgate.com/blog/netgate-launches-4200-max",
	netgate2100Shop: "https://shop.netgate.com/products/2100-max-pfsense",
	netgate6100Shop:
		"https://shop.netgate.com/collections/all/products/6100-max-pfsense",
	protectliVp2440: "https://protectli.com/product/vp2440/",
	opnsenseDec750:
		"https://shop.opnsense.com/product/dec750-opnsense-desktop-security-appliance/",
	pfsenseRestore: "https://doc.pfsense.org/backup/restore.html",
	diskLifetime:
		"https://docs.netgate.com/pfsense/en/latest/troubleshooting/disk-lifetime.html",
	diskWrites:
		"https://docs.netgate.com/pfsense/en/latest/troubleshooting/disk-writes.html",
	fortinetShare:
		"https://www.placera.se/telegram/avanza/10_35590978-7644-4faf-ab4f-25e6adff2c51.html",
} as const;

type ComparisonRow = {
	model: string;
	price: string;
	specs: string;
	verdict: string;
};

export async function generateMetadata({
	params,
}: PageProps<"/[locale]/pfsense">): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};
	const t = await getTranslations({ locale, namespace: "pfsensePage.meta" });
	return {
		title: t("title"),
		description: t("description"),
		robots: NON_INDEXABLE_ROBOTS,
	};
}

export default async function PfsensePage({
	params,
}: PageProps<"/[locale]/pfsense">) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();
	setRequestLocale(locale);

	const t = await getTranslations({ locale, namespace: "pfsensePage" });
	const list = (key: string) => t.raw(key) as string[];
	const rows = t.raw("comparison.rows") as ComparisonRow[];

	return (
		<div className="site-content-page page-dark">
			<TopAnchor />
			<main id="main-content" className={layout.main}>
				<Container className={styles.content}>
					<header className={layout.header}>
						<p className={styles.eyebrow}>{t("eyebrow")}</p>
						<h1 className={layout.title}>{t("title")}</h1>
						<p className={layout.lead}>{t("lead")}</p>
						<p className={styles.updated}>{t("updated")}</p>
					</header>

					<section className={layout.section} aria-labelledby="incident">
						<h2 id="incident" className={layout.sectionTitle}>
							{t("incident.title")}
						</h2>
						{list("incident.paragraphs").map((paragraph) => (
							<p key={paragraph}>{paragraph}</p>
						))}
						<h3 className={styles.subTitle}>{t("incident.methodTitle")}</h3>
						<ul>
							{list("incident.method").map((item) => (
								<li key={item}>{item}</li>
							))}
						</ul>
					</section>

					<section className={layout.section} aria-labelledby="criteria">
						<h2 id="criteria" className={layout.sectionTitle}>
							{t("criteria.title")}
						</h2>
						<ul>
							{list("criteria.items").map((item) => (
								<li key={item}>{item}</li>
							))}
						</ul>
					</section>

					<section className={layout.section} aria-labelledby="comparison">
						<h2 id="comparison" className={layout.sectionTitle}>
							{t("comparison.title")}
						</h2>
						<p>{t("comparison.intro")}</p>
						{/* biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must be keyboard reachable */}
						<div
							className={styles.tableScroll}
							role="region"
							aria-label={t("comparison.scrollLabel")}
							tabIndex={0}
						>
							<table className={styles.table}>
								<caption className={layout.visuallyHidden}>
									{t("comparison.caption")}
								</caption>
								<thead>
									<tr>
										<th scope="col">{t("comparison.columns.model")}</th>
										<th scope="col">{t("comparison.columns.price")}</th>
										<th scope="col">{t("comparison.columns.specs")}</th>
										<th scope="col">{t("comparison.columns.verdict")}</th>
									</tr>
								</thead>
								<tbody>
									{rows.map((row) => (
										<tr key={row.model}>
											<th scope="row">{row.model}</th>
											<td>{row.price}</td>
											<td>{row.specs}</td>
											<td>{row.verdict}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</section>

					<section className={layout.section} aria-labelledby="rejected">
						<h2 id="rejected" className={layout.sectionTitle}>
							{t("rejected.title")}
						</h2>
						<ul>
							{list("rejected.items").map((item) => (
								<li key={item}>{item}</li>
							))}
						</ul>
						<h3 className={styles.subTitle}>{t("rejected.marketTitle")}</h3>
						<ul>
							{list("rejected.market").map((item) => (
								<li key={item}>{item}</li>
							))}
						</ul>
					</section>

					<section className={layout.section} aria-labelledby="choice">
						<h2 id="choice" className={layout.sectionTitle}>
							{t("choice.title")}
						</h2>
						<p>{t("choice.lead")}</p>
						<h3 className={styles.subTitle}>{t("choice.stepsTitle")}</h3>
						<ol>
							{list("choice.steps").map((step) => (
								<li key={step}>{step}</li>
							))}
						</ol>
						<p className={styles.callout}>{t("choice.bonus")}</p>
					</section>

					<section className={layout.section} aria-labelledby="security">
						<h2 id="security" className={layout.sectionTitle}>
							{t("security.title")}
						</h2>
						<ul>
							{list("security.items").map((item) => (
								<li key={item}>{item}</li>
							))}
						</ul>
					</section>

					<section className={layout.section} aria-labelledby="sources">
						<h2 id="sources" className={layout.sectionTitle}>
							{t("sources.title")}
						</h2>
						<ul className={styles.sources}>
							{Object.entries(SOURCES).map(([id, href]) => (
								<li key={id}>
									<ExternalLink href={href}>
										{t(`sources.links.${id}`)}
									</ExternalLink>
								</li>
							))}
						</ul>
					</section>
				</Container>
			</main>
		</div>
	);
}
