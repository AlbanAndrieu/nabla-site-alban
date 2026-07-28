import type { HtmlExtractMode } from "./htmlFromPublic";
import type { SitePageSlug } from "./sitePageCatalog";

export type HtmlContentPageSpec = {
	file: string;
	mode: HtmlExtractMode;
	bodyClass?: string;
	analyticsMode?: "vercel" | "full" | "showcase" | "home";
	ahrefsKey?: string;
};

/** Pages rendered from a fragment kept under public/ during the App Router migration. */
export const HTML_CONTENT_PAGES = {
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
		analyticsMode: "showcase",
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
		analyticsMode: "showcase",
	},
	truenas: {
		file: "truenas.html",
		mode: "navHeaderMain",
		bodyClass: "site-content-page page-dark page-truenas",
		analyticsMode: "showcase",
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
} satisfies Partial<Record<SitePageSlug, HtmlContentPageSpec>>;

export type HtmlContentPageSlug = keyof typeof HTML_CONTENT_PAGES;

export function isHtmlContentPageSlug(
	slug: string,
): slug is HtmlContentPageSlug {
	return Object.hasOwn(HTML_CONTENT_PAGES, slug);
}
