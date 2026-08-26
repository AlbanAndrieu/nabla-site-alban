import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import PublicHtmlFragment from "@/app/components/PublicHtmlFragment";
import SkipToMainContent from "@/components/SkipToMainContent";
import TopAnchor from "@/components/TopAnchor";
import { routing } from "@/i18n/routing";
import { metadataFromPublicHtml } from "@/lib/htmlFromPublic";
import { enrichPageMetadata } from "@/lib/socialMetadata";
import AiNativeSections from "./AiNativeSections";
import AiPageGuide from "./AiPageGuide";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};
	const metadata = await metadataFromPublicHtml("ai.html", "/ai", locale);
	return enrichPageMetadata(metadata, { slug: "ai", locale });
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
