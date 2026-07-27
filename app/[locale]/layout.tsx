import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import Footer from "@/app/components/Footer";
import RouteHeader from "@/components/RouteHeader";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
	return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
	children,
	params,
}: LayoutProps<"/[locale]">) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();

	setRequestLocale(locale);
	const messages = await getMessages();
	const site = messages.site as {
		backHome: string;
		backToTop: string;
		backToTopAria: string;
		legalNotices: string;
	};

	return (
		<NextIntlClientProvider locale={locale} messages={messages}>
			<RouteHeader />
			{children}
			<Footer
				backHome={site.backHome}
				backToTop={site.backToTop}
				backToTopAria={site.backToTopAria}
				legalNotices={site.legalNotices}
				locale={locale}
			/>
		</NextIntlClientProvider>
	);
}
