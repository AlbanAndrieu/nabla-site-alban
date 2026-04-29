import type { Metadata } from "next";
import Script from "next/script";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { loadPublicHtmlFragment, type SiteLocale } from "@/lib/htmlFromPublic";

import { routing } from "@/i18n/routing";
import { loadCvHtmlFragment, metadataFromCvHtml } from "@/lib/cvFromPublic";

import { HOME_JSON_LD, HOME_JSON_LD_FR } from "@/lib/htmlFromPublic";

type Props = {
	params: Promise<{ locale: string; path: string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale, path } = await params;
	const normalizedLocale = hasLocale(routing.locales, locale)
		? locale
		: routing.defaultLocale;
	const canonicalPath = `/${normalizedLocale}/cv/${path.join("/")}`;
	return metadataFromCvHtml(path, canonicalPath, normalizedLocale);
}
/*
export default async function CvPathPage({ params }: Props) {
	const { locale, path } = await params;
	const normalizedLocale = hasLocale(routing.locales, locale)
		? locale
		: routing.defaultLocale;
	setRequestLocale(normalizedLocale);

	try {
		// const { html } = await loadCvHtmlFragment(path, normalizedLocale);
		const { html } =
		return (
			<div
				className="page-cv"
				suppressHydrationWarning
				// eslint-disable-next-line react/no-danger
				dangerouslySetInnerHTML={{ __html: html }}
			/>
		);
	} catch {
		notFound();
	}
}
*/

export default async function HomePage({ params }: Props) {
	const { locale: requestedLocale } = await params;
	const locale = hasLocale(["en", "fr"], requestedLocale)
		? (requestedLocale as SiteLocale)
		: "en";
	setRequestLocale(locale);
	const t = await getTranslations("site");
	const inner = await loadPublicHtmlFragment("cv/index.html", "main", locale);

	return (
		<div className="page-cv">
			<script
				type="application/ld+json"
				// eslint-disable-next-line react/no-danger
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(
						locale === "fr" ? HOME_JSON_LD_FR : HOME_JSON_LD,
					),
				}}
			/>
			<Script src="/obs-connection.js" strategy="lazyOnload" />
			<Script
				src="https://challenges.cloudflare.com/turnstile/v0/api.js"
				strategy="lazyOnload"
			/>
			<Script
				src="/site-analytics.js"
				strategy="afterInteractive"
				data-analytics-mode="home"
				data-ahrefs-key="tg3zLMS/bebJFl0LxctiCw"
			/>
			<Script
				src="https://uptime.betterstack.com/widgets/announcement.js"
				strategy="lazyOnload"
				data-id="150620"
			/>
			<div id="top" />
			<a href="#main-content" className="skip-to-main">
				{t("skipToMainContent")}
			</a>
			<LocaleSwitcher />
			<main
				id="main-content"
				suppressHydrationWarning
				dangerouslySetInnerHTML={{ __html: inner }}
			/>
		</div>
	);
}
