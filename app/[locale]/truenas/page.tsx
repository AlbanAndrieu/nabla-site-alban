import Script from "next/script";

import AppsSection from "../../components/truenas/AppsSection";
import BillOfMaterialsSection from "../../components/truenas/BillOfMaterialsSection";
import HardwareSection from "../../components/truenas/HardwareSection";
import HomeLabSection from "../../components/truenas/HomeLabSection";
import ToolsSection from "../../components/truenas/ToolsSection";

export default function TruenasPage() {
	return (
		<div className="site-content-page page-dark">
			<div id="top" />
			<a href="#main-content" className="skip-to-main">
				Skip to main content
			</a>
			<main id="main-content">
				<AppsSection />
				<HomeLabSection />
				<HardwareSection />
				<BillOfMaterialsSection />
				<ToolsSection />
			</main>
			<Script src="/site-widgets.js" strategy="afterInteractive" />
		</div>
	);
}
