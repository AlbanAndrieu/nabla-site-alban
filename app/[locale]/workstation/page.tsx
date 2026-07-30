import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import PublicHtmlFragment from "@/app/components/PublicHtmlFragment";
import SiteWidgetsScript from "@/components/SiteWidgetsScript";
import TopAnchor from "@/components/TopAnchor";
import { routing } from "@/i18n/routing";
import { metadataFromPublicHtml } from "@/lib/htmlFromPublic";
import { NON_INDEXABLE_ROBOTS } from "@/lib/sitePageCatalog";
import BillOfMaterialsSection from "../../components/workstation/BillOfMaterialsSection";
import HardwareSection from "../../components/workstation/HardwareSection";

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
	const site = await getTranslations("site");

	return (
		<div className="site-content-page page-dark page-truenas page-workstation">
			<TopAnchor />
			<a href="#main-content" className="skip-to-main">
				{site("skipToMainContent")}
			</a>
			<PublicHtmlFragment
				file="workstation.html"
				mode="headerMain"
				locale={locale}
			/>

			<div className="hardware-section-bg">
				<HardwareSection />
				<BillOfMaterialsSection />
			</div>
			<SiteWidgetsScript />
		</div>
	);
}
