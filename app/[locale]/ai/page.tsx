import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import PublicHtmlFragment from "@/app/components/PublicHtmlFragment";
import TopAnchor from "@/components/TopAnchor";
import { routing } from "@/i18n/routing";
import { metadataFromPublicHtml } from "@/lib/htmlFromPublic";
import AiNativeSections from "./AiNativeSections";
import AiPageGuide from "./AiPageGuide";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};
	return metadataFromPublicHtml("ai.html", "/ai.html", locale);
}

export default async function AiBestPracticesPage({ params }: Props) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();
	setRequestLocale(locale);
	const site = await getTranslations("site");

	return (
		<>
			<link rel="stylesheet" href="/nabla.css" />
			<TopAnchor />
			<a href="#main-content" className="skip-to-main">{site("skipToMainContent")}</a>
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
