import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { CtidCopy } from "@/components/ciso/CtidFilters";
import CtidIntelligence from "@/components/ciso/CtidIntelligence";
import SiteWidgetsScript from "@/components/SiteWidgetsScript";
import SecurityNav from "@/components/security/SecurityNav";
import TopAnchor from "@/components/TopAnchor";
import { routing } from "@/i18n/routing";
import { canonicalPagePath, NON_INDEXABLE_ROBOTS } from "@/lib/sitePageCatalog";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>;
}): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};
	const t = await getTranslations({ locale, namespace: "ctid" });
	return {
		title: t("title"),
		description: t("description"),
		robots: NON_INDEXABLE_ROBOTS,
	};
}

export default async function CTIDPage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();
	setRequestLocale(locale);
	const fr = locale === "fr";
	const t = await getTranslations("ctid");
	const view = await getTranslations("ctidView");
	return (
		<div className="site-content-page page-ciso page-dark">
			<TopAnchor />
			<main id="main-content">
				<section
					className="hero-section ciso-hero"
					aria-labelledby="ctid-title"
				>
					<div className="hero-content">
						<h1 id="ctid-title" className="hero-title">
							<i className="fa-solid fa-shield-halved" aria-hidden="true" />{" "}
							{t("title")}
						</h1>
						<div
							role="img"
							aria-label={t("heroImageLabel")}
							style={{ fontSize: "2rem" }}
						>
							{t("hero")}
						</div>
						<p className="hero-subtitle">{t("subtitle")}</p>
						<p className="hero-description">{t("description")}</p>
						<p className="hero-description">
							<a href={canonicalPagePath("security/ciso", locale)}>
								{fr
									? "Retour au tableau de bord CISO"
									: "Back to the CISO dashboard"}
							</a>
							{" · "}
							<a href="/security-feed.xml">
								{fr ? "S'abonner au RSS sécurité" : "Subscribe to security RSS"}
							</a>
						</p>
					</div>
				</section>
				<SecurityNav locale={fr ? "fr" : "en"} active="ctid" />
				<section
					className="ciso-card ciso-card--wide ciso-card--centered"
					aria-labelledby="ctid-threats-heading"
				>
					<h2 id="ctid-threats-heading">
						<i className="fa-solid fa-globe" aria-hidden="true" />{" "}
						{t("threatFeedTitle")}
					</h2>
					<p>{t("threatFeedIntro")}</p>
					<CtidIntelligence
						locale={fr ? "fr" : "en"}
						copy={view.raw("filters") as CtidCopy}
					/>
				</section>
			</main>
			<SiteWidgetsScript />
		</div>
	);
}
