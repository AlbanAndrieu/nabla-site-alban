import type { Metadata } from "next";
import Script from "next/script";
import AIMLOpsSection from "../../components/expertise/AIMLOpsSection";
import HeroSection from "../../components/expertise/HeroSection";
import ServicesSection from "../../components/expertise/ServicesSection";
import SkillsSection from "../../components/expertise/SkillsSection";
import TechnologiesSection from "../../components/expertise/TechnologiesSection";

export async function generateMetadata({
	params,
}: PageProps<"/[locale]/expertise">): Promise<Metadata> {
	const { locale } = await params;
	const isFrench = locale === "fr";

	return {
		title: isFrench
			? "Services et expertise technique — Alban Andrieu"
			: "Services & technical expertise — Alban Andrieu",
		description: isFrench
			? "Services DevSecOps, cybersécurité, cloud, plateforme et IA proposés par Alban Andrieu."
			: "DevSecOps, cybersecurity, cloud, platform and AI services offered by Alban Andrieu.",
		alternates: {
			canonical: isFrench ? "/fr/expertise.html" : "/expertise.html",
			languages: { en: "/expertise.html", fr: "/fr/expertise.html" },
		},
	};
}

export default function ExpertisePage() {
	return (
		<div className="site-content-page page-dark">
			<div id="top" />
			<a href="#main-content" className="skip-to-main">
				Skip to main content
			</a>
			<main id="main-content">
				<HeroSection />
				<ServicesSection />
				<AIMLOpsSection />
				<SkillsSection />
				<TechnologiesSection />
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
