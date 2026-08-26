import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import PublicHtmlFragment from "@/app/components/PublicHtmlFragment";
import SiteWidgetsScript from "@/components/SiteWidgetsScript";
import SkipToMainContent from "@/components/SkipToMainContent";
import TopAnchor from "@/components/TopAnchor";
import { routing } from "@/i18n/routing";
import { metadataFromPublicHtml } from "@/lib/htmlFromPublic";
import { NON_INDEXABLE_ROBOTS } from "@/lib/sitePageCatalog";
import BillOfMaterialsSection from "../../components/workstation/BillOfMaterialsSection";
import HardwareSection from "../../components/workstation/HardwareSection";
import WorkstationHero from "./WorkstationHero";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};

	const metadata = await metadataFromPublicHtml(
		"workstation.html",
		"/workstation.html",
		locale,
	);
	return { ...metadata, robots: NON_INDEXABLE_ROBOTS };
}

export default async function WorkstationPage({ params }: Props) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();

	setRequestLocale(locale);

	return (
		<div className="site-content-page page-dark page-truenas page-workstation">
			<TopAnchor />
			<SkipToMainContent />
			<WorkstationHero locale={locale} />
			<main id="main-content" className="mb-5">
				<PublicHtmlFragment file="workstation.html" mode="main" locale={locale} />
				<div className="hardware-section-bg">
					<HardwareSection />
					<BillOfMaterialsSection />
				</div>
			</main>
			<SiteWidgetsScript />
		</div>
	);
}
