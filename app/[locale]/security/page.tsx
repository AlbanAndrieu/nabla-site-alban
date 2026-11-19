import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import TopAnchor from "@/components/TopAnchor";
import { routing } from "@/i18n/routing";
import { canonicalPagePath } from "@/lib/sitePageCatalog";
import { enrichPageMetadata } from "@/lib/socialMetadata";
import SecurityCoreSections, { SecurityHero } from "./SecurityCoreSections";
import SecurityVisualizations from "./SecurityVisualizations";

// Public shell only: interactive data remains client-side and OWNER APIs stay gated.
export const dynamic = "force-static";

export async function generateMetadata({
	params,
}: PageProps<"/[locale]/security">): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};
	const t = await getTranslations({ locale, namespace: "securityPage.meta" });
	const metadata: Metadata = {
		title: t("title"),
		description: t("description"),
		alternates: { canonical: canonicalPagePath("security", locale) },
	};
	return enrichPageMetadata(metadata, { slug: "security", locale });
}

export default async function SecurityPage({
	params,
}: PageProps<"/[locale]/security">) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();

	setRequestLocale(locale);
	const ctem = await getTranslations({ locale, namespace: "ctemPage" });
	const contactHref = canonicalPagePath("contact", locale);

	return (
		<div className="site-content-page page-security page-dark">
			<TopAnchor />
			<SecurityHero locale={locale} contactHref={contactHref} />
			<main id="main-content" className="security-resources">
				<section className="resource-card" aria-labelledby="ctem-heading">
					<h2 id="ctem-heading">{ctem("title")}</h2>
					<p>{ctem("lead")}</p>
					<a href={canonicalPagePath("security/ctem", locale)}>
						{ctem("discover")}
					</a>
				</section>
				<SecurityCoreSections locale={locale} />
				<SecurityVisualizations locale={locale} />
			</main>
		</div>
	);
}
