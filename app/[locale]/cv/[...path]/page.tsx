import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import TopAnchor from "@/components/TopAnchor";
import ActionLink from "@/components/ui/ActionLink";
import { routing } from "@/i18n/routing";
import { loadCvHtmlFragment, metadataFromCvHtml } from "@/lib/cvFromPublic";
import { NON_INDEXABLE_ROBOTS } from "@/lib/sitePageCatalog";
import styles from "./CvBackAction.module.css";

type Props = {
	params: Promise<{ locale: string; path: string[] }>;
};

type CvDocumentLocale = "de" | "en" | "fr" | "no";

const BACK_TO_INDEX_LABEL: Record<CvDocumentLocale, string> = {
	de: "Zurück zum Lebenslauf-Index",
	en: "Back to CV index",
	fr: "Retour à l’index du CV",
	no: "Tilbake til CV-oversikten",
};

function cvDocumentLocale(path: string[], fallback: "en" | "fr"): CvDocumentLocale {
	const filename = path.at(-1) ?? "";
	const match = filename.match(/-(de|en|fr|no)\.html$/i);
	return (match?.[1]?.toLowerCase() as CvDocumentLocale | undefined) ?? fallback;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale, path } = await params;
	const normalizedLocale = hasLocale(routing.locales, locale)
		? locale
		: routing.defaultLocale;
	const canonicalPath = `/${normalizedLocale}/cv/${path.join("/")}`;
	const metadata = await metadataFromCvHtml(
		path,
		canonicalPath,
		normalizedLocale,
	);
	return { ...metadata, robots: NON_INDEXABLE_ROBOTS };
}

export default async function CvPathPage({ params }: Props) {
	const { locale, path } = await params;
	const normalizedLocale = hasLocale(routing.locales, locale)
		? locale
		: routing.defaultLocale;
	setRequestLocale(normalizedLocale);

	const site = await getTranslations("site");
	try {
		const { html } = await loadCvHtmlFragment(path, normalizedLocale);
		const documentLocale = cvDocumentLocale(path, normalizedLocale);
		const cvIndexHref = normalizedLocale === "fr" ? "/fr/cv" : "/cv";

		return (
			<div className="page-cv" suppressHydrationWarning>
				<TopAnchor />
				<a href="#main-content" className="skip-to-main">
					{site("skipToMainContent")}
				</a>
				{/* eslint-disable-next-line react/no-danger */}
				<div id="main-content" dangerouslySetInnerHTML={{ __html: html }} />
				<nav className={styles.backAction} aria-label={BACK_TO_INDEX_LABEL[documentLocale]}>
					<ActionLink href={cvIndexHref} variant="primary">
						<span aria-hidden="true">←</span>
						{BACK_TO_INDEX_LABEL[documentLocale]}
					</ActionLink>
				</nav>
			</div>
		);
	} catch {
		notFound();
	}
}
