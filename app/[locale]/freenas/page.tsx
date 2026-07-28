

import HeroSection from "../../components/freenas/HeroSection";
import MainCardsSection from "../../components/freenas/MainCardsSection";
// À compléter avec les autres sections

export default async function FreenasPage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);
	// t = getTranslations("freenas") prêt pour l'i18n sur chaque bloc
	return (
		<div className="site-content-page page-dark">
			<main id="main-content" className="container py-4 pb-5">
				<HeroSection />
				<MainCardsSection />
				{/* PluginsSection, MonitoringSection, GamingSection... */}
			</main>
		</div>
	);
}
