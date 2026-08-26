import type { Metadata } from "next";
import type { ReactNode } from "react";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/socialMetadata";

export async function generateMetadata({
	params,
}: LayoutProps<"/[locale]/jm">): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};
	const t = await getTranslations({ locale, namespace: "jm" });
	return buildPageMetadata({
		title: t("pageTitle"),
		description: t("metadataDescription"),
		slug: "jm",
		locale,
	});
}

export default function JmLayout({ children }: { children: ReactNode }) {
	return children;
}
