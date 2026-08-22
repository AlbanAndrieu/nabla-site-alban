import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import SiteWidgetsScript from "@/components/SiteWidgetsScript";
import TopAnchor from "@/components/TopAnchor";
import { routing } from "@/i18n/routing";
import { canonicalPagePath } from "@/lib/sitePageCatalog";

import AppsSection from "../../components/truenas/AppsSection";
import BillOfMaterialsSection, {
	type BillOfMaterialsCopy,
} from "../../components/truenas/BillOfMaterialsSection";
import HardwareSection, {
	type HardwareCopy,
} from "../../components/truenas/HardwareSection";
import HeroSection from "../../components/truenas/HeroSection";
import HomeLabSection from "../../components/truenas/HomeLabSection";
import ToolsSection from "../../components/truenas/ToolsSection";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};
	const t = await getTranslations({ locale, namespace: "truenasPage" });

	return {
		title: t("metadataTitle"),
		description: t("metadataDescription"),
		alternates: {
			canonical: canonicalPagePath("truenas", locale),
			languages: {
				en: canonicalPagePath("truenas", "en"),
				fr: canonicalPagePath("truenas", "fr"),
			},
		},
	};
}

export default async function TruenasPage({ params }: Props) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();

	setRequestLocale(locale);
	const [site, t] = await Promise.all([
		getTranslations("site"),
		getTranslations("truenasPage"),
	]);
	const hardwareCopy = t.raw("hardware") as HardwareCopy;
	const billOfMaterialsCopy = t.raw("bom") as BillOfMaterialsCopy;

	return (
		<>
			<div className="site-content-page page-dark">
				<TopAnchor />
				<a href="#main-content" className="skip-to-main">
					{site("skipToMainContent")}
				</a>
				<main id="main-content">
					<HeroSection
						ariaLabel={t("heroLabel")}
						title={t("heroTitle")}
						lead={t("heroLead")}
						credit={t("heroCredit")}
						topics={t("heroTopics")}
					/>
					<AppsSection
						title={t("apps.title")}
						lead={t("apps.lead")}
						iconsBefore={t("apps.iconsBefore")}
						iconsAfter={t("apps.iconsAfter")}
						endpointLabel="Endpoint"
						internalLabel={t("services.internal")}
					/>
					<HomeLabSection
						title={t("homelab.title")}
						intro={t("homelab.intro")}
						purpose={t("homelab.purpose")}
						projectDescription={t("homelab.projectDescription")}
						openProject={t("homelab.openProject")}
						nablaHref={canonicalPagePath("nabla", locale)}
					/>
					<div className="hardware-section-bg">
						<HardwareSection copy={hardwareCopy} />
						<BillOfMaterialsSection copy={billOfMaterialsCopy} />
					</div>
					<ToolsSection
						title={t("tools.title")}
						webUi={t("tools.webUi")}
						signIn={t("tools.signIn")}
						logoAlt={t("tools.logoAlt")}
					/>
				</main>
				<SiteWidgetsScript />
			</div>
		</>
	);
}
