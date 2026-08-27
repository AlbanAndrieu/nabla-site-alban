import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { routing } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/socialMetadata";

export async function generateMetadata({
	params,
}: LayoutProps<"/[locale]/contact">): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};
	const t = await getTranslations({ locale, namespace: "contactPage" });
	return buildPageMetadata({
		title: t("meta.title"),
		description: t("meta.description"),
		slug: "contact",
		locale,
	});
}

export default function ContactLayout({ children }: { children: ReactNode }) {
	return children;
}
