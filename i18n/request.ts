import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { type AppLocale, routing } from "@/i18n/routing";

export default getRequestConfig(async ({ requestLocale }) => {
	const requested = await requestLocale;
	const locale = hasLocale(routing.locales, requested)
		? requested
		: routing.defaultLocale;
	const appLocale = locale as AppLocale;
	const baseMessages = (await import(`../messages/${appLocale}.json`)).default;
	const truenasMessages = (await import(`../messages/truenas/${appLocale}.json`)).default;

	return {
		locale,
		messages: {
			...baseMessages,
			...truenasMessages,
		},
	};
});
