import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import PublicHtmlFragment from "@/app/components/PublicHtmlFragment";
import SkipToMainContent from "@/components/SkipToMainContent";
import TopAnchor from "@/components/TopAnchor";
import { routing } from "@/i18n/routing";
import { buildLegacyPageMetadata } from "@/lib/legacyPageMetadata";
import AiNativeSections from "./AiNativeSections";
import AiPageGuide from "./AiPageGuide";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};
	return buildLegacyPageMetadata({
		file: "ai.html",
		slug: "ai",
		locale,
		fallbackTitle: locale === "fr" ? "IA et MLOps" : "AI and MLOps",
		fallbackDescription:
			locale === "fr"
				? "Architecture, sécurité et exploitation de plateformes IA."
				: "Architecture, security, and operations for AI platforms.",
	});
}

export default async function AiBestPracticesPage({ params }: Props) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();
	setRequestLocale(locale);

	return (
		<>
			<link rel="stylesheet" href="/nabla.css" />
			<TopAnchor />
			<SkipToMainContent />
			<PublicHtmlFragment
				file="ai.html"
				mode="navHeaderMain"
				locale={locale}
				className="site-content-page page-ai page-dark page-nabla-best-practices"
				suppressHydrationWarning
				omitElementIds={["workflow-automation-ai-tools"]}
			/>
			<AiNativeSections locale={locale} />
			<AiPageGuide locale={locale} />
		</>
	);
}
