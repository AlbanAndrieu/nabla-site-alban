import type { ReactNode } from "react";
import TopAnchor from "@/components/TopAnchor";

export default function PaymentShell({
	children,
	locale,
}: {
	children: ReactNode;
	locale: "en" | "fr";
}) {
	return (
		<div className="site-content-page page-dark payment-flow">
			<link rel="stylesheet" href="/checkout.css" />
			<TopAnchor />
			<a href="#main-content" className="skip-to-main">
				{locale === "fr"
					? "Aller au contenu principal"
					: "Skip to main content"}
			</a>
			{children}
		</div>
	);
}
