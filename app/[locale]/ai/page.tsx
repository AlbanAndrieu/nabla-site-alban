import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import {
	loadPublicHtmlFragment,
	metadataFromPublicHtml,
} from "@/lib/htmlFromPublic";

export async function generateMetadata({
	params,
}: PageProps<"/[locale]/ai">): Promise<Metadata> {
	const { locale } = await params;
	return metadataFromPublicHtml("ai.html", "/ai.html", locale);
}

export default async function AiPage({ params }: PageProps<"/[locale]/ai">) {
	const { locale } = await params;
	setRequestLocale(locale);
	const html = await loadPublicHtmlFragment("ai.html", "mainOuter", locale);
	return (
		<>
			<LocaleSwitcher />
			<div
				className="site-content-page page-ai page-dark page-nabla-best-practices"
				dangerouslySetInnerHTML={{ __html: html }}
			/>
		</>
	);
}
