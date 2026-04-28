import type { Metadata } from "next";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import SiteFooter from "@/components/SiteFooter";
import { routing } from "@/i18n/routing";

import "@/app/globals.css";

export const metadata: Metadata = {
	metadataBase: new URL("https://dr-alban.com"),
};

type Props = {
	children: ReactNode;
	params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
	return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({ children, params }: Props) {
	const { locale } = await params;
	setRequestLocale(locale);
	const messages = await getMessages();

	return (
		<html
			lang={locale}
			data-nabla-app="next-intl"
			data-scroll-behavior="smooth"
			suppressHydrationWarning
		>
			<head>
				<link rel="icon" href="/assets/nabla/nabla-4.svg" />
				<link
					rel="stylesheet"
					href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/fontawesome.min.css"
					type="text/css"
				/>
				<link href="/assets/fontawesome/css/fontawesome.css" rel="stylesheet" />
				<link href="/assets/fontawesome/css/brands.css" rel="stylesheet" />
				<link href="/assets/fontawesome/css/solid.css" rel="stylesheet" />

				{/* For contact page */}
				<link
					rel="stylesheet"
					href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
					type="text/css"
				/>

				<link rel="stylesheet" href="/landing-sections.css" />
				<link rel="stylesheet" href="/wireframe.css" />
				<link rel="stylesheet" href="/theme.css" />
				<link rel="stylesheet" href="/style.css" />
				<link rel="stylesheet" href="/print.css" />
				{/* arf is for test page */}
				<link rel="stylesheet" href="/arf.css" />
				<link rel="stylesheet" href="/site-content-page.css" />
				{/* page-layouts is for test contact in body class page-contact */}
				<link rel="stylesheet" href="/page-layouts.css" />
				{/* nabla is for ai page */}
				<link rel="stylesheet" href="/nabla.css" />
				<link rel="stylesheet" href="/timeline.css" />
				<link rel="stylesheet" href="/education.css" />
				{/* opensource is for nabla page */}
				<link rel="stylesheet" href="/opensource.css" />
				<link
					rel="stylesheet"
					href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.2.1/css/bootstrap.min.css"
					integrity="sha512-siwe/oXMhSjGCwLn+scraPOWrJxHlUgMBMZXdPe2Tnk3I0x3ESCoLz7WZ5NTH6SZrywMY+PB1cjyqJ5jAluCOg=="
					crossOrigin="anonymous"
					referrerPolicy="no-referrer"
				/>
				<link
					rel="stylesheet"
					href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.9.1/font/bootstrap-icons.min.css"
					integrity="sha512-5PV92qsds/16vyYIJo3T/As4m2d8b6oWYfoqV+vtizRB6KhF1F9kYzWzQmsO6T3z3QG2Xdhrx7FQ+5R1LiQdUA=="
					crossOrigin="anonymous"
					referrerPolicy="no-referrer"
				/>
				<meta name="color-scheme" content="light dark" />
				<meta name="referrer" content="always" />
			</head>
			<body
				className="site-content-page page-contact page-nabla-best-practices page-dark"
				suppressHydrationWarning
			>
				{/* Static HTML uses Google Translate via /site-widgets.js; Next uses next-intl (see data-no-google-translate). */}
				<NextIntlClientProvider messages={messages}>
					{children}
					<SiteFooter />
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
