import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import HomelabServicesScripts from "@/components/HomelabServicesScripts";
import { routing } from "@/i18n/routing";
import {
	loadPublicHtmlFragment,
	metadataFromPublicHtml,
} from "@/lib/htmlFromPublic";
import { MARKETING_PAGES } from "@/lib/marketingPages";

/** Static HTML loads these after `</main>`; App Router only embeds the fragment, so we attach them here. */
const HOMELAB_SERVICES_SLUGS = new Set(["nabla", "truenas"]);

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
	return Object.keys(MARKETING_PAGES).flatMap((slug) =>
		(["en", "fr"] as const).map((locale) => ({ locale, slug })),
	);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale, slug } = await params;
	const spec = MARKETING_PAGES[slug];
	if (!spec) return {};
	const normalizedLocale = routing.locales.includes(locale as "en" | "fr")
		? locale
		: routing.defaultLocale;
	return metadataFromPublicHtml(spec.file, `/${slug}.html`, normalizedLocale);
}

export default async function MarketingSlugPage({ params }: Props) {
	const { locale, slug } = await params;
	const normalizedLocale = routing.locales.includes(locale as "en" | "fr")
		? locale
		: routing.defaultLocale;
	setRequestLocale(normalizedLocale);
	const t = await getTranslations("site");
	const spec = MARKETING_PAGES[slug];
	if (!spec) notFound();

	const html = await loadPublicHtmlFragment(
		spec.file,
		spec.mode,
		normalizedLocale,
	);

	return (
		<>
			<div id="top" />
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
