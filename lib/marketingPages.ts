import type { HtmlExtractMode } from "./htmlFromPublic";

export type MarketingPageSpec = {
	file: string;
	mode: HtmlExtractMode;
	bodyClass?: string;
	analyticsMode?: "vercel" | "full" | "marketing" | "home";
	ahrefsKey?: string;
};

/** Root-level HTML pages (slug → source under public/). Excludes index and 404. */
export const MARKETING_PAGES: Record<string, MarketingPageSpec> = {
	index: {
		file: "index.html",
		mode: "navHeaderMain",
		bodyClass:
			"site-content-page page-home page-dark page-nabla-best-practices",
	},
	expertise: {
		file: "expertise.html",
		mode: "mainOuter",
		bodyClass: "site-content-page page-dark",
	},
	workstation: {
		file: "workstation.html",
		mode: "mainOuter",
		bodyClass: "site-content-page page-dark page-truenas page-workstation",
		analyticsMode: "marketing",
	},
	startup: {
		file: "startup.html",
		mode: "mainOuter",
		bodyClass: "site-content-page page-dark",
	},
	"startup-thanks": {
		file: "startup-thanks.html",
		mode: "mainOuter",
		bodyClass: "site-content-page page-dark",
	},
	nabla: {
		file: "nabla.html",
		mode: "navHeaderMain",
		bodyClass: "site-content-page page-dark page-nabla-best-practices",
		analyticsMode: "full",
	},
	login: {
		file: "login.html",
		mode: "mainOuter",
		bodyClass: "site-content-page page-login page-dark",
	},
	link: {
		file: "link.html",
		mode: "mainOuter",
		bodyClass: "site-content-page page-dark",
		analyticsMode: "full",
	},
	ctid: {
		file: "ctid.html",
		mode: "body",
		bodyClass: "site-content-page page-ctid page-dark",
	},
	freenas: {
		file: "freenas.html",
		mode: "mainOuter",
		bodyClass: "site-content-page page-dark",
		analyticsMode: "marketing",
	},
	truenas: {
		file: "truenas.html",
		mode: "navHeaderMain",
		bodyClass: "site-content-page page-dark page-truenas",
		analyticsMode: "marketing",
	},
	test: {
		file: "test.html",
		mode: "mainOuter",
		bodyClass: "site-content-page page-dark",
		analyticsMode: "home",
		ahrefsKey: "tg3zLMS/bebJFl0LxctiCw",
	},
	email: {
		file: "email.html",
		mode: "mainOuter",
		bodyClass: "site-content-page page-dark",
	},
};
