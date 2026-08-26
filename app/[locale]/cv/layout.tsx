import type { Metadata } from "next";
import type { ReactNode } from "react";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/socialMetadata";

export async function generateMetadata({
	params,
}: LayoutProps<"/[locale]/cv">): Promise<Metadata> {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) return {};
	const t = await getTranslations({ locale, namespace: "cvPage" });
	return buildPageMetadata({
		title: t("meta.title"),
		description: t("meta.description"),
		slug: "cv",
		locale,
	});
}

export default function CvLayout({ children }: { children: ReactNode }) {
	return children;
}
