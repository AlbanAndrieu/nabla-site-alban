import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import JsonLd from "@/components/JsonLd";
import SiteWidgetsScript from "@/components/SiteWidgetsScript";
import SkipToMainContent from "@/components/SkipToMainContent";
import TopAnchor from "@/components/TopAnchor";
import { routing } from "@/i18n/routing";
import { canonicalPagePath } from "@/lib/sitePageCatalog";
import { buildPageMetadata } from "@/lib/socialMetadata";
import AIMLOpsSection from "../../components/expertise/AIMLOpsSection";
import HeroSection from "../../components/expertise/HeroSection";
import ServicesSection, {
	type ExpertiseService,
} from "../../components/expertise/ServicesSection";
import SkillsSection from "../../components/expertise/SkillsSection";
import TechnologiesSection from "../../components/expertise/TechnologiesSection";

export async function generateMetadata({
	params,
}: PageProps<"/[locale]/expertise">): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};
	const t = await getTranslations({ locale, namespace: "expertisePage" });

	return buildPageMetadata({
		title: t("metadataTitle"),
		description: t("metadataDescription"),
		slug: "expertise",
		locale,
	});
}

export default async function ExpertisePage({
	params,
}: PageProps<"/[locale]/expertise">) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();

	setRequestLocale(locale);
	const t = await getTranslations("expertisePage");
	const services = t.raw("services.items") as ExpertiseService[];
	const aiBullets = t.raw("aiml.bullets") as string[];
	const skillCategoryTitles = t.raw("skills.categoryTitles") as string[];
	const technologyGroupTitles = t.raw("technologies.groupTitles") as string[];
	const canonicalUrl = `https://albanandrieu.com${canonicalPagePath(
		"expertise",
		locale,
	)}`;
	const professionalServiceJsonLd = {
		"@context": "https://schema.org",
		"@type": "ProfessionalService",
		name: "Alban Andrieu — DevSecOps & Cloud Architecture",
		url: canonicalUrl,
		description: t("metadataDescription"),
		email: "job@albandrieu.com",
		areaServed: ["France", "Europe", "Remote"],
		serviceType: services.map((service) => service.title),
		provider: {
			"@type": "Person",
			name: "Alban Andrieu",
			url: "https://albanandrieu.com/",
		},
	};
	return (
		<div className="site-content-page page-dark">
			<JsonLd data={professionalServiceJsonLd} />
			<TopAnchor />
			<SkipToMainContent />
			<main id="main-content">
				<HeroSection
					label={t("hero.label")}
					imageAlt={t("hero.imageAlt")}
					tagline={t("hero.tagline")}
				/>
				<ServicesSection
					title={t("services.title")}
					subtitle={t("services.subtitle")}
					services={services}
				/>
				<AIMLOpsSection
					title={t("aiml.title")}
					subtitle={t("aiml.subtitle")}
					bullets={aiBullets}
				/>
				<SkillsSection
					title={t("skills.title")}
					subtitle={t("skills.subtitle")}
					categoryTitles={skillCategoryTitles}
					cvLink={t("skills.cvLink")}
					cvHref={locale === "fr" ? "/fr/cv" : "/cv"}
				/>
				<TechnologiesSection
					title={t("technologies.title")}
					subtitle={t("technologies.subtitle")}
					groupTitles={technologyGroupTitles}
					officialWebsite={t("technologies.officialWebsite")}
				/>
			</main>
			<SiteWidgetsScript printPdf coffeeFab />
		</div>
	);
}
