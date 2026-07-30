import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import PublicHtmlFragment from "@/app/components/PublicHtmlFragment";
import TopAnchor from "@/components/TopAnchor";
import { routing } from "@/i18n/routing";
import { metadataFromPublicHtml } from "@/lib/htmlFromPublic";

export async function generateMetadata({
	params,
}: PageProps<"/[locale]/security">): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};
	return metadataFromPublicHtml("security.html", "/security.html", locale);
}

export default async function SecurityPage({
	params,
}: PageProps<"/[locale]/security">) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();

	setRequestLocale(locale);
	const site = await getTranslations("site");

	return (
		<>
			<TopAnchor />
			<a href="#main-content" className="skip-to-main">
				{site("skipToMainContent")}
			</a>
			<PublicHtmlFragment
				file="security.html"
				mode="headerMain"
				locale={locale}
				className="site-content-page page-security page-dark"
			/>
			<Script
				src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.17/d3.min.js"
				strategy="afterInteractive"
			/>
			<Script src="/arf.js" strategy="afterInteractive" />
		</>
	);
}
