import {
	type HtmlExtractMode,
	loadPublicHtmlFragment,
	type SiteLocale,
} from "@/lib/htmlFromPublic";

type Props = Readonly<{
	file: string;
	mode: HtmlExtractMode;
	locale: SiteLocale;
	className?: string;
	suppressHydrationWarning?: boolean;
}>;

/** Transitional boundary for trusted HTML files while sections move to React. */
export default async function PublicHtmlFragment({
	file,
	mode,
	locale,
	className,
	suppressHydrationWarning = false,
}: Props) {
	const html = await loadPublicHtmlFragment(file, mode, locale);

	return (
		<div
			className={className}
			suppressHydrationWarning={suppressHydrationWarning}
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	);
}
