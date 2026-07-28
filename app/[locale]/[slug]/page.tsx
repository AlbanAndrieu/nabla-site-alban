import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import { getTranslations, setRequestLocale } from "next-intl/server";
import HomelabServicesScripts from "@/components/HomelabServicesScripts";
import TopAnchor from "@/components/TopAnchor";
import { routing } from "@/i18n/routing";
import {
	HTML_CONTENT_PAGES,
	isHtmlContentPageSlug,
} from "@/lib/htmlContentPages";
import {
	loadPublicHtmlFragment,
	metadataFromPublicHtml,
} from "@/lib/htmlFromPublic";
import { isSeoPageSlug, NON_INDEXABLE_ROBOTS } from "@/lib/sitePageCatalog";

/** Static HTML loads these after `</main>`; App Router only embeds the fragment, so we attach them here. */
const HOMELAB_SERVICES_SLUGS = new Set(["nabla", "truenas"]);

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
	return Object.keys(HTML_CONTENT_PAGES).flatMap((slug) =>
		(["en", "fr"] as const).map((locale) => ({ locale, slug })),
	);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale, slug } = await params;
	if (!isHtmlContentPageSlug(slug)) return {};
	const spec = HTML_CONTENT_PAGES[slug];
	const normalizedLocale = routing.locales.includes(locale as "en" | "fr")
		? locale
		: routing.defaultLocale;
	const metadata = await metadataFromPublicHtml(
		spec.file,
		`/${slug}.html`,
		normalizedLocale,
	);
	return isSeoPageSlug(slug)
		? metadata
		: { ...metadata, robots: NON_INDEXABLE_ROBOTS };
}

export default async function HtmlContentPage({ params }: Props) {
	const { locale, slug } = await params;
	const normalizedLocale = routing.locales.includes(locale as "en" | "fr")
		? locale
		: routing.defaultLocale;
	setRequestLocale(normalizedLocale);
	const t = await getTranslations("site");
	if (!isHtmlContentPageSlug(slug)) notFound();
	const spec = HTML_CONTENT_PAGES[slug];

	const html = await loadPublicHtmlFragment(
		spec.file,
		spec.mode,
		normalizedLocale,
	);
	const analyticsMode = spec.analyticsMode ?? "vercel";

	return (
		<>
			<Script
				id={`site-analytics-${slug}`}
				src="/site-analytics.js"
				strategy="afterInteractive"
				data-analytics-mode={analyticsMode}
				data-ahrefs-key={spec.ahrefsKey}
			/>
			<TopAnchor />
			<a href="#main-content" className="skip-to-main">
				{t("skipToMainContent")}
			</a>
			<div
				className={spec.bodyClass}
				suppressHydrationWarning
				dangerouslySetInnerHTML={{ __html: html }}
			/>
			{HOMELAB_SERVICES_SLUGS.has(slug) ? <HomelabServicesScripts /> : null}
		</>
	);
}
