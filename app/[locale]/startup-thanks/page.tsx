import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import TopAnchor from "@/components/TopAnchor";
import { routing } from "@/i18n/routing";
import { NON_INDEXABLE_ROBOTS } from "@/lib/sitePageCatalog";

export async function generateMetadata({
	params,
}: PageProps<"/[locale]/startup-thanks">): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};
	const t = await getTranslations({ locale, namespace: "startup" });

	return {
		title: t("thanks.title"),
		robots: NON_INDEXABLE_ROBOTS,
	};
}

export default async function StartupThanksPage({
	params,
}: PageProps<"/[locale]/startup-thanks">) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();

	setRequestLocale(locale);
	const site = await getTranslations("site");
	const t = await getTranslations("startup");
	const localePrefix = locale === "fr" ? "/fr" : "";
	const homePath = localePrefix || "/";
	const startupPath = `${localePrefix}/startup.html`;
	return (
		<div className="site-content-page page-dark">
			<TopAnchor />
			<a href="#main-content" className="skip-to-main">
				{site("skipToMainContent")}
			</a>
			<nav className="page-nav container py-3" aria-label="Breadcrumb">
				<a href={homePath} className="text-decoration-none">
					<i className="fas fa-home" aria-hidden="true"></i>{" "}
					{t("navigation.backHome")}
				</a>
			</nav>
			<main
				id="main-content"
				role="main"
				className="container py-5 col-lg-7 text-center"
			>
				<p className="display-6 text-success mb-3" aria-hidden="true">
					<i className="fas fa-circle-check"></i>
				</p>
				<h1 className="h2 mb-3">{t("thanks.title")}</h1>
				<p className="lead text-secondary mb-4">
					{t("thanks.beforeEmail")}
					<strong>job@albandrieu.com</strong>.
					{t("thanks.afterEmail")}
					<a
						href="https://calendly.com/alban-andrieu"
						target="_blank"
						rel="noopener noreferrer"
					>
						{t("thanks.call")}
					</a>
					.
				</p>
				<a href={homePath} className="btn btn-primary me-2">
					{t("thanks.backHome")}
				</a>
				<a href={startupPath} className="btn btn-outline-secondary">
					{t("thanks.another")}
				</a>
			</main>
			<footer className="footer" role="contentinfo">
				<div className="footer-links">
					<a href="/policy/legal.html">
						{t("thanks.legal")}
					</a>
				</div>
				<p className="footer-copyright"></p>
			</footer>
			<Script
				src="/site-widgets.js"
				strategy="afterInteractive"
				data-print-pdf=""
			/>
		</div>
	);
}
