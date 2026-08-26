import type { Metadata } from "next";
import type { ReactNode } from "react";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/socialMetadata";

export async function generateMetadata({
	params,
}: LayoutProps<"/[locale]/nabla">): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};
	const t = await getTranslations({ locale, namespace: "nabla.metadata" });
	return buildPageMetadata({
		title: t("title"),
		description: t("description"),
		slug: "nabla",
		locale,
	});
}

export default function NablaLayout({ children }: { children: ReactNode }) {
	return children;
}
