import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import SkipToMainContent from "@/components/SkipToMainContent";
import TopAnchor from "@/components/TopAnchor";
import { routing } from "@/i18n/routing";
import LoginClient from "./LoginClient";

export default async function LoginPage({
	params,
}: PageProps<"/[locale]/login">) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) notFound();
	setRequestLocale(locale);

	return (
		<div className="site-content-page page-login page-dark">
			<TopAnchor />
			<SkipToMainContent />
			<LoginClient />
		</div>
	);
}
