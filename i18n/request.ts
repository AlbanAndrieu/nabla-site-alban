import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { type AppLocale, routing } from "@/i18n/routing";

export default getRequestConfig(async ({ requestLocale }) => {
	const requested = await requestLocale;
	const locale = hasLocale(routing.locales, requested)
		? requested
		: routing.defaultLocale;

	return {
		locale,
		messages: (await import(`../messages/${locale as AppLocale}.json`)).default,
	};
});
