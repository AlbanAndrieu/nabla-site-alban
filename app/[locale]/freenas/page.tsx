import Script from "next/script";
import { getTranslations, setRequestLocale } from "next-intl/server";
import TopAnchor from "@/components/TopAnchor";
import HeroSection from "../../components/freenas/HeroSection";
import JenkinsAndPluginsSection from "../../components/freenas/JenkinsAndPluginsSection";
import MonitoringAndGamingSection from "../../components/freenas/MonitoringAndGamingSection";

export default async function FreenasPage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	const tSite = await getTranslations("site");
	setRequestLocale(locale);
	return (
		<div className="site-content-page page-dark">
			<TopAnchor />
			<a href="#main-content" className="skip-to-main">
				{tSite("skipToMainContent")}
			</a>
			<main id="main-content" className="container py-4 pb-5">
				<HeroSection />
				<JenkinsAndPluginsSection />
				<MonitoringAndGamingSection />
			</main>
			<Script
				src="/site-widgets.js"
				strategy="afterInteractive"
				data-print-pdf=""
				data-coffee-fab=""
			/>
		</div>
	);
}
