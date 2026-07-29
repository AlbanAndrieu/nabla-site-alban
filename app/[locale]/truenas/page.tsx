import { notFound } from "next/navigation";
import Script from "next/script";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import TopAnchor from "@/components/TopAnchor";
import { routing } from "@/i18n/routing";

import AppsSection from "../../components/truenas/AppsSection";
import BillOfMaterialsSection from "../../components/truenas/BillOfMaterialsSection";
import HardwareSection from "../../components/truenas/HardwareSection";
import HomeLabSection from "../../components/truenas/HomeLabSection";
import ToolsSection from "../../components/truenas/ToolsSection";

export default async function TruenasPage({ params }: Props) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();

	setRequestLocale(locale);
	const site = await getTranslations("site");

	return (
		<>
			<div className="site-content-page page-dark">
				<TopAnchor />
				<a href="#main-content" className="skip-to-main">
					{site("skipToMainContent")}
				</a>
				<main id="main-content">
					<AppsSection />
					<HomeLabSection />
					<div className="hardware-section-bg">
						<HardwareSection />
						<BillOfMaterialsSection />
					</div>
					<ToolsSection />
				</main>
				<Script src="/site-widgets.js" strategy="afterInteractive" />
			</div>
		</>
	);
}
