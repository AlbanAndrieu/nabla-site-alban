import type { Metadata } from "next";
import Script from "next/script";
import { setRequestLocale } from "next-intl/server";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import {
	loadPublicHtmlFragment,
	metadataFromPublicHtml,
} from "@/lib/htmlFromPublic";

export async function generateMetadata({
	params,
}: PageProps<"/[locale]/security">): Promise<Metadata> {
	const { locale } = await params;
	return metadataFromPublicHtml("security.html", "/security.html", locale);
}

export default async function SecurityPage({
	params,
}: PageProps<"/[locale]/security">) {
	const { locale } = await params;
	setRequestLocale(locale);
	const html = await loadPublicHtmlFragment(
		"security.html",
		"mainOuter",
		locale,
	);
	return (
		<>
			<LocaleSwitcher />
			<div
				className="site-content-page page-security page-dark"
				dangerouslySetInnerHTML={{ __html: html }}
			/>
			<Script
				src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.17/d3.min.js"
				strategy="afterInteractive"
			/>
			<Script src="/arf.js" strategy="afterInteractive" />
		</>
	);
}
