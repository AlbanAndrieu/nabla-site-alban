import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
	locales: ["en", "fr"],
	defaultLocale: "en",
	localePrefix: "as-needed",
	localeDetection: true,
});

export type AppLocale = (typeof routing.locales)[number];
