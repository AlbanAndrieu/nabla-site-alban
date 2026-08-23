import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Hero from "@/app/components/Hero";
import HomeContactSection from "@/app/components/home/HomeContactSection";
import HomeEducationSection from "@/app/components/home/HomeEducationSection";
import HomeOutcomesSection from "@/app/components/home/HomeOutcomesSection";
import HomeTimelineSection from "@/app/components/home/HomeTimelineSection";
import JsonLd from "@/components/JsonLd";
import SiteWidgetsScript from "@/components/SiteWidgetsScript";
import TopAnchor from "@/components/TopAnchor";
import { routing } from "@/i18n/routing";
import { HOME_JSON_LD, HOME_JSON_LD_FR } from "@/lib/htmlFromPublic";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();

	setRequestLocale(locale);
	const site = await getTranslations("site");

	return (
		<>
			<JsonLd data={locale === "fr" ? HOME_JSON_LD_FR : HOME_JSON_LD} />
			<link rel="stylesheet" href="/timeline.css" precedence="page" />
			<link rel="stylesheet" href="/education.css" precedence="page" />
			<TopAnchor />
			<a href="#main-content" className="skip-to-main">
				{site("skipToMainContent")}
			</a>
			<main id="main-content">
				<Hero />
				<HomeOutcomesSection locale={locale} />
				<HomeTimelineSection locale={locale} />
				<HomeEducationSection locale={locale} />
				<HomeContactSection locale={locale} />
			</main>
			<SiteWidgetsScript printPdf />
		</>
	);
}
