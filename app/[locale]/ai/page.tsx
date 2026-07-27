import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import {
	loadPublicHtmlFragment,
	metadataFromPublicHtml,
} from "@/lib/htmlFromPublic";

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
	const html = await loadPublicHtmlFragment("ai.html", "navHeaderMain", locale);

	return (
		<>
			<link rel="stylesheet" href="/nabla.css" />
			<div
				className="site-content-page page-ai page-dark page-nabla-best-practices"
				suppressHydrationWarning
				dangerouslySetInnerHTML={{ __html: html }}
			/>
		</>
	);
}
