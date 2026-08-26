import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import PublicHtmlFragment from "@/app/components/PublicHtmlFragment";
import SkipToMainContent from "@/components/SkipToMainContent";
import TopAnchor from "@/components/TopAnchor";
import { routing } from "@/i18n/routing";
import { buildLegacyPageMetadata } from "@/lib/legacyPageMetadata";
import { canonicalPagePath } from "@/lib/sitePageCatalog";
import { enrichPageMetadata } from "@/lib/socialMetadata";
import SecurityArfTree from "./SecurityArfTree";
import SecurityCoreSections, { SecurityHero } from "./SecurityCoreSections";

const NATIVE_SECTION_IDS = [
	"owasp-resources",
	"personal-security-checklist",
	"network-security-scanning",
] as const;

export async function generateMetadata({
	params,
}: PageProps<"/[locale]/security">): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};
	const metadata = await metadataFromPublicHtml("security.html", "/security", locale);
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
			</main>
			<SecurityArfTree locale={locale} />
		</div>
	);
}
