import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import SiteWidgetsScript from "@/components/SiteWidgetsScript";
import SkipToMainContent from "@/components/SkipToMainContent";
import TopAnchor from "@/components/TopAnchor";
import { routing } from "@/i18n/routing";
import { canonicalPagePath } from "@/lib/sitePageCatalog";
import { buildPageMetadata } from "@/lib/socialMetadata";

import HomelabServicesSection from "../../components/homelab/HomelabServicesSection";
import BillOfMaterialsSection from "../../components/truenas/BillOfMaterialsSection";
import HardwareSection from "../../components/truenas/HardwareSection";
import HeroSection from "../../components/truenas/HeroSection";
import HomeLabSection from "../../components/truenas/HomeLabSection";
import NablaProjectSection from "../../components/truenas/NablaProjectSection";
import ToolsSection from "../../components/truenas/ToolsSection";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};
	const t = await getTranslations({ locale, namespace: "truenas.page.meta" });

	return buildPageMetadata({
		title: t("title"),
		description: t("description"),
		slug: "truenas",
		locale,
	});
}

export default async function TruenasPage({ params }: Props) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();
	setRequestLocale(locale);

	return (
		<div className="site-content-page page-dark page-truenas">
			<TopAnchor />
			<SkipToMainContent />
			<main id="main-content">
				<HeroSection />
				<HomeLabSection />
				<HomelabServicesSection headingId="truenas-services" />
				<div className="hardware-section-bg">
					<HardwareSection />
					<BillOfMaterialsSection />
				</div>
				<ToolsSection />
				<NablaProjectSection nablaHref={canonicalPagePath("nabla", locale)} />
			</main>
			<SiteWidgetsScript />
		</div>
	);
}
