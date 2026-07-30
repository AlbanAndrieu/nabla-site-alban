"use client";

import Script from "next/script";
import { useEffect } from "react";

type SiteWidgetsScriptProps = {
	axeptio?: boolean;
	coffeeFab?: boolean;
	noCoffeeFab?: boolean;
	noGoogleTranslate?: boolean;
	printPdf?: boolean;
	revealAnimation?: string;
	revealEffect?: "animation" | "opacity";
	scrollReveal?: string;
};

/**
 * Loads the legacy widget runtime from a client boundary.
 *
 * Next.js 16.3 preview can leave an afterInteractive Script rendered directly
 * by a Server Component at the preload stage without injecting its script tag.
 */
export default function SiteWidgetsScript({
	axeptio = false,
	coffeeFab = false,
	noCoffeeFab = false,
	noGoogleTranslate = false,
	printPdf = false,
	revealAnimation,
	revealEffect,
	scrollReveal,
}: SiteWidgetsScriptProps) {
	const configuration = [
		axeptio && "axeptio",
		coffeeFab && "coffee",
		noCoffeeFab && "no-coffee",
		noGoogleTranslate && "no-translate",
		printPdf && "print",
		revealEffect,
		scrollReveal && "reveal",
	]
		.filter(Boolean)
		.join("-");

	useEffect(
		() => () => {
			if (printPdf) document.getElementById("nabla-print-pdf-btn")?.remove();
			if (coffeeFab) {
				document.getElementById("coffee-fab")?.remove();
				document.getElementById("coffeeModal")?.remove();
			}
		},
		[coffeeFab, printPdf],
	);

	return (
		<Script
			src={`/site-widgets.js?config=${configuration || "default"}`}
			strategy="afterInteractive"
			data-axeptio={axeptio ? "" : undefined}
			data-coffee-fab={coffeeFab ? "" : undefined}
			data-no-coffee-fab={noCoffeeFab ? "" : undefined}
			data-no-google-translate={noGoogleTranslate ? "" : undefined}
			data-print-pdf={printPdf ? "" : undefined}
			data-reveal-animation={revealAnimation}
			data-reveal-effect={revealEffect}
			data-scroll-reveal={scrollReveal}
		/>
	);
}
