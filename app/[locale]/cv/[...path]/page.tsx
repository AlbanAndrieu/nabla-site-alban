import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import TopAnchor from "@/components/TopAnchor";
import { routing } from "@/i18n/routing";
import { loadCvHtmlFragment, metadataFromCvHtml } from "@/lib/cvFromPublic";
import { NON_INDEXABLE_ROBOTS } from "@/lib/sitePageCatalog";

type Props = {
	params: Promise<{ locale: string; path: string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale, path } = await params;
	const normalizedLocale = hasLocale(routing.locales, locale)
		? locale
		: routing.defaultLocale;
	const canonicalPath = `/${normalizedLocale}/cv/${path.join("/")}`;
	const metadata = await metadataFromCvHtml(
		path,
		canonicalPath,
		normalizedLocale,
	);
	return { ...metadata, robots: NON_INDEXABLE_ROBOTS };
}

export default async function CvPathPage({ params }: Props) {
	const { locale, path } = await params;
	const normalizedLocale = hasLocale(routing.locales, locale)
		? locale
		: routing.defaultLocale;
	setRequestLocale(normalizedLocale);

	const site = await getTranslations("site");
	try {
		const { html } = await loadCvHtmlFragment(path, normalizedLocale);
		return (
			<div className="page-cv" suppressHydrationWarning>
				<TopAnchor />
				<a href="#main-content" className="skip-to-main">
					{site("skipToMainContent")}
				</a>
				{/* eslint-disable-next-line react/no-danger */}
				<div id="main-content" dangerouslySetInnerHTML={{ __html: html }} />
			</div>
		);
	} catch {
		notFound();
	}
}

/*
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
			<TopAnchor />
			<a href="#main-content" className="skip-to-main">
				{site("skipToMainContent")}
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
*/
