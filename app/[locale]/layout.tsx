import "../design-tokens.css";
import "../globals.css";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import {
	getMessages,
	getTranslations,
	setRequestLocale,
} from "next-intl/server";
import Footer from "@/app/components/Footer";
import RouteHeader from "@/components/RouteHeader";
import { routing } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/siteMetadata";

export function generateStaticParams() {
	return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
	params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};

	const t = await getTranslations({ locale, namespace: "home.meta" });
	const title = t("title");
	const description = t("description");
	const socialMetadata = buildPageMetadata({
		slug: "index",
		locale,
		title,
		description,
	});

	return {
		...socialMetadata,
		metadataBase: new URL("https://albanandrieu.com"),
		title: { absolute: title },
		keywords: [
			"DevSecOps engineer",
			"cloud architect",
			"cloud security consultant",
			"AWS",
			"Azure",
			"OVHcloud",
			"AI infrastructure",
			"ISO 27001",
			"SOC 2",
		],
		authors: [{ name: "Alban Andrieu", url: "/" }],
		creator: "Alban Andrieu",
		referrer: "origin-when-cross-origin",
	};
}

export default async function LocaleLayout({
	children,
	params,
}: LayoutProps<"/[locale]">) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();

	setRequestLocale(locale);
	const messages = await getMessages({ locale });
	const site = messages.site as {
		backHome: string;
		backToTop: string;
		backToTopAria: string;
		copyright: string;
		legalNotices: string;
		rssFeedAria: string;
	};
	const copyright = site.copyright.replace(
		"{year}",
		String(new Date().getUTCFullYear()),
	);
	const configuredAnalyticsMode = process.env.NEXT_PUBLIC_ANALYTICS_MODE;
	const analyticsMode = ["full", "home", "showcase", "vercel"].includes(
		configuredAnalyticsMode ?? "",
	)
		? configuredAnalyticsMode
		: "vercel";

	return (
		<html lang={locale} data-nabla-app="next-intl" suppressHydrationWarning>
			<head>
				<meta name="color-scheme" content="light dark" />
				<link rel="stylesheet" href="/landing-sections.css" />
				<link rel="stylesheet" href="/wireframe.css" />
				<link rel="stylesheet" href="/theme.css" />
				<link rel="stylesheet" href="/style.css" />
				<link rel="stylesheet" href="/print.css" />
				<link rel="stylesheet" href="/site-content-page.css" />
				<link rel="stylesheet" href="/page-layouts.css" />
				<link rel="stylesheet" href="/assets/fontawesome/css/fontawesome.css" />
				<link rel="stylesheet" href="/assets/fontawesome/css/brands.css" />
				<link rel="stylesheet" href="/assets/fontawesome/css/solid.css" />
				<link
					rel="stylesheet"
					href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.2.1/css/bootstrap.min.css"
					crossOrigin="anonymous"
					referrerPolicy="no-referrer"
				/>
				<link
					rel="stylesheet"
					href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.9.1/font/bootstrap-icons.min.css"
					crossOrigin="anonymous"
					referrerPolicy="no-referrer"
				/>
			</head>
			<body>
				<NextIntlClientProvider locale={locale} messages={messages}>
					<RouteHeader />
					{children}
					<Footer
						backHome={site.backHome}
						backToTop={site.backToTop}
						backToTopAria={site.backToTopAria}
						legalNotices={site.legalNotices}
						locale={locale}
						rssFeedAria={site.rssFeedAria}
						copyright={copyright}
					/>
				</NextIntlClientProvider>
				<Script
					src="/site-analytics.js"
					data-analytics-mode={analyticsMode}
					data-ahrefs-key={process.env.AHREFS_ANALYTICS_KEY}
					strategy="afterInteractive"
				/>
			</body>
		</html>
	);
}
