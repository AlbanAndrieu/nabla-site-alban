import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { routing } from "@/i18n/routing";

import "@/app/globals.css";

type Props = {
	children: ReactNode;
	params: Promise<{ locale: string; path: string[] }>;
};

export function generateStaticParams() {
	return routing.locales.map((locale) => ({ locale }));
}

export default async function CVLayout({ children, params }: Props) {
	const { locale, path } = await params;
	setRequestLocale(locale);
	const messages = await getMessages();

	// Determine if this is a sub-page (e.g., cv-small-fr.html)
	const isSubPage = path && path.length === 1 && path[0].startsWith("cv-");

	// Set body classes based on page type
	const bodyClassName = isSubPage
		? "page-cv"
		: "site-content-page page-cv page-dark page-nabla-best-practices";

	return (
		<html lang={locale}>
			<head>
				{/* Inject cv-theme.css only for sub pages like cv-small-fr.html */}
				{isSubPage && <link rel="stylesheet" href="/cv/cv-theme.css" />}
			</head>
			<body className={bodyClassName} suppressHydrationWarning>
				<NextIntlClientProvider messages={messages}>
					{children}
				</NextIntlClientProvider>
				<Script
					src="/site-widgets.js"
					strategy="afterInteractive"
					data-print-pdf
					data-no-coffee-fab
					data-no-google-translate
				/>
			</body>
		</html>
	);
}
