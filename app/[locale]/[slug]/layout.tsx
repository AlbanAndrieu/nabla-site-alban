import type { ReactNode } from "react";
import { marketingSlugStylesheets } from "@/lib/marketingSlugStylesheets";

type Props = {
	children: ReactNode;
	params: Promise<{ locale: string; slug: string }>;
};

/** Mirrors `<link rel="stylesheet">` from each page’s `public/*.html` shell (not in root layout). */
export default async function MarketingSlugLayout({ children, params }: Props) {
	const { slug } = await params;
	const hrefs = marketingSlugStylesheets(slug);
	return (
		<>
			{hrefs.map((href) => (
				<link key={href} rel="stylesheet" href={href} />
			))}
			{children}
		</>
	);
}
