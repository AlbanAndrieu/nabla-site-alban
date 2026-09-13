import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import SiteWidgetsScript from "@/components/SiteWidgetsScript";
import SkipToMainContent from "@/components/SkipToMainContent";
import TopAnchor from "@/components/TopAnchor";
import { type AppLocale, routing } from "@/i18n/routing";
import { canonicalPagePath, NON_INDEXABLE_ROBOTS } from "@/lib/sitePageCatalog";
import BillOfMaterialsSection from "../../components/workstation/BillOfMaterialsSection";
import HardwareSection from "../../components/workstation/HardwareSection";
import WorkstationHero from "../../components/workstation/WorkstationHero";
import WorkstationServiceSections from "../../components/workstation/WorkstationServiceSections";

type Props = { params: Promise<{ locale: string }> };

function workstationCanonical(locale: AppLocale) {
	return locale === "fr" ? "/fr/workstation.html" : "/workstation.html";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};

	const appLocale = locale as AppLocale;
	const t = await getTranslations({ locale: appLocale, namespace: "workstation.meta" });
	const canonical = workstationCanonical(appLocale);
	const canonicalUrl = new URL(canonical, "https://albanandrieu.com").href;

	return {
		title: t("title"),
		description: t("description"),
		robots: NON_INDEXABLE_ROBOTS,
		alternates: { canonical },
		openGraph: {
			title: t("title"),
			description: t("description"),
			url: canonicalUrl,
		},
	};
}

export default async function WorkstationPage({ params }: Props) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();

	const appLocale = locale as AppLocale;
	setRequestLocale(appLocale);
	const truenasHref = canonicalPagePath("truenas", appLocale);
	const nablaHref = canonicalPagePath("nabla", appLocale);

	return (
		<div className="site-content-page page-dark page-truenas page-workstation">
			<TopAnchor />
			<SkipToMainContent />
			<WorkstationHero truenasHref={truenasHref} />
			<main id="main-content" role="main" className="mb-5">
				<WorkstationServiceSections
					truenasHref={truenasHref}
					nablaHref={nablaHref}
				/>
				<div className="hardware-section-bg">
					<HardwareSection />
					<BillOfMaterialsSection />
				</div>
			</main>
			<SiteWidgetsScript />
		</div>
	);
}
