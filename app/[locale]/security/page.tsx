import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import PublicHtmlFragment from "@/app/components/PublicHtmlFragment";
import SkipToMainContent from "@/components/SkipToMainContent";
import TopAnchor from "@/components/TopAnchor";
import { routing } from "@/i18n/routing";
import { canonicalPagePath } from "@/lib/sitePageCatalog";
import { enrichPageMetadata } from "@/lib/socialMetadata";
import SecurityCoreSections, { SecurityHero } from "./SecurityCoreSections";
import SecurityVisualizations from "./SecurityVisualizations";

const NATIVE_SECTION_IDS = [
	"owasp-resources",
	"personal-security-checklist",
	"network-security-scanning",
	"system-hardening-cis",
	"ssh-security-hardening",
	"security-visualizations",
] as const;

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
	const contactHref = canonicalPagePath("contact", locale);

	return (
		<div className="site-content-page page-security page-dark">
			<TopAnchor />
			<SkipToMainContent />
			<SecurityHero locale={locale} contactHref={contactHref} />
			<main id="main-content" className="security-resources">
				<SecurityCoreSections locale={locale} />
				<PublicHtmlFragment
					file="security.html"
					mode="main"
					locale={locale}
					omitElementIds={NATIVE_SECTION_IDS}
				/>
				<SecurityVisualizations locale={locale} />
			</main>
		</div>
	);
}
