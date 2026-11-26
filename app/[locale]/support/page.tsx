import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import SupportChat, {
	type SupportChatCopy,
} from "@/components/support/SupportChat";
import TopAnchor from "@/components/TopAnchor";
import { routing } from "@/i18n/routing";
import { NON_INDEXABLE_ROBOTS } from "@/lib/sitePageCatalog";

export async function generateMetadata({
	params,
}: PageProps<"/[locale]/support">): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};
	const t = await getTranslations({ locale, namespace: "supportPage" });
	// Kept out of search results: crawlers have no use for a chat endpoint.
	return {
		title: t("meta.title"),
		description: t("meta.description"),
		robots: NON_INDEXABLE_ROBOTS,
	};
}

export default async function SupportPage({
	params,
}: PageProps<"/[locale]/support">) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();
	setRequestLocale(locale);
	const t = await getTranslations("supportPage");
	return (
		<div className="site-content-page page-dark">
			<TopAnchor />
			<main id="main-content" className="container py-4 pb-5">
				<header className="mb-4">
					<h1 className="h2 mb-2">{t("title")}</h1>
					<p className="lead text-secondary mb-2">{t("intro")}</p>
					<p className="small text-secondary mb-0">{t("privacy")}</p>
				</header>
				<SupportChat
					copy={t.raw("chat") as SupportChatCopy}
					locale={locale}
					turnstileSiteKey={
						process.env.NEXT_PUBLIC_SUPPORT_TURNSTILE_SITE_KEY || undefined
					}
				/>
			</main>
		</div>
	);
}
