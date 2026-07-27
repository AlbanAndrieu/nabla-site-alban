import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import TopAnchor from "@/components/TopAnchor";
import { routing } from "@/i18n/routing";
import {
	loadPublicHtmlFragment,
	metadataFromPublicHtml,
	type SiteLocale,
} from "@/lib/htmlFromPublic";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale } = await params;
	const normalizedLocale: SiteLocale =
		locale === routing.defaultLocale || locale === "fr" ? locale : "en";
	const base = await metadataFromPublicHtml(
		"checkout.html",
		"/checkout",
		normalizedLocale,
	);
	return {
		...base,
		robots: { index: false, follow: false },
	};
}

export default async function CheckoutPage({ params }: Props) {
	const { locale } = await params;
	const normalizedLocale: SiteLocale =
		locale === routing.defaultLocale || locale === "fr" ? locale : "en";
	setRequestLocale(normalizedLocale);
	const t = await getTranslations("site");
	const html = await loadPublicHtmlFragment(
		"checkout.html",
		"mainOuter",
		normalizedLocale,
	);

	return (
		<>
			<TopAnchor />
			<a href="#main-content" className="skip-to-main">
				{t("skipToMainContent")}
			</a>
			<div
				className="site-content-page"
				suppressHydrationWarning
				dangerouslySetInnerHTML={{ __html: html }}
			/>
		</>
	);
}
