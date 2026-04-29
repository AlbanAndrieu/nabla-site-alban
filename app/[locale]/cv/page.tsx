import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { routing } from "@/i18n/routing";
import { loadCvHtmlFragment, metadataFromCvHtml } from "@/lib/cvFromPublic";

type Props = {
	params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale } = await params;
	const normalizedLocale = hasLocale(routing.locales, locale)
		? locale
		: routing.defaultLocale;
	return metadataFromCvHtml([], `/${normalizedLocale}/cv`, normalizedLocale);
}

export default async function CvIndexPage({ params }: Props) {
	const { locale } = await params;
	const normalizedLocale = hasLocale(routing.locales, locale)
		? locale
		: routing.defaultLocale;
	setRequestLocale(normalizedLocale);

	try {
		// const { html } = await loadCvHtmlFragment([], normalizedLocale);
		return (
			<div
				className="cv-page"
				suppressHydrationWarning
				// eslint-disable-next-line react/no-danger
				dangerouslySetInnerHTML={{ __html: html }}
			/>
		);
	} catch {
		notFound();
	}
}
