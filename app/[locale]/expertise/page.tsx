import Script from "next/script";
import AIMLOpsSection from "../../components/expertise/AIMLOpsSection";
import HeroSection from "../../components/expertise/HeroSection";
import ServicesSection from "../../components/expertise/ServicesSection";
import SkillsSection from "../../components/expertise/SkillsSection";
import TechnologiesSection from "../../components/expertise/TechnologiesSection";

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
