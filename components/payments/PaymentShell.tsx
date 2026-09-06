import type { ReactNode } from "react";
import SkipToMainContent from "@/components/SkipToMainContent";
import TopAnchor from "@/components/TopAnchor";

export default function PaymentShell({ children }: { children: ReactNode }) {
	return (
		<div className="site-content-page page-dark payment-flow">
			<link rel="stylesheet" href="/checkout.css" />
			<TopAnchor />
			<SkipToMainContent />
			{children}
		</div>
	);
}
