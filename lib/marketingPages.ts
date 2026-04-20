import type { HtmlExtractMode } from "@/lib/htmlFromPublic";

export type MarketingPageSpec = {
	file: string;
	mode: HtmlExtractMode;
	bodyClass?: string;
};

/** Root-level HTML pages (slug → source under public/). Excludes index and 404. */
export const MARKETING_PAGES: Record<string, MarketingPageSpec> = {
	contact: {
		file: "contact.html",
		mode: "mainOuter",
		bodyClass: "site-content-page page-contact",
	},
	ai: {
		file: "ai.html",
		mode: "mainOuter",
		bodyClass: "site-content-page page-nabla-best-practices",
	},
	security: {
		file: "security.html",
		mode: "mainOuter",
		bodyClass: "site-content-page page-security page-dark",
	},
	expertise: {
		file: "expertise.html",
		mode: "mainOuter",
		bodyClass: "site-content-page page-dark",
	},
	workstation: {
		file: "workstation.html",
		mode: "mainOuter",
		bodyClass: "site-content-page page-dark truenas-page workstation-page",
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
	pricing: {
		file: "pricing.html",
		mode: "mainOuter",
		bodyClass: "site-content-page page-dark",
	},
	success: {
		file: "success.html",
		mode: "mainOuter",
		bodyClass: "site-content-page",
	},
	cancel: {
		file: "cancel.html",
		mode: "mainOuter",
		bodyClass: "site-content-page",
	},
	payment: {
		file: "payment.html",
		mode: "mainOuter",
		bodyClass: "site-content-page page-dark",
	},
	ciso: {
		file: "ciso.html",
		mode: "mainOuter",
		bodyClass: "site-content-page page-ciso page-dark",
	},
	nabla: {
		file: "nabla.html",
		mode: "mainOuter",
		bodyClass: "site-content-page page-dark page-nabla-best-practices",
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
	},
	ctid: {
		file: "ctid.html",
		mode: "mainOuter",
		bodyClass: "site-content-page page-ctid page-dark",
	},
	freenas: {
		file: "freenas.html",
		mode: "mainOuter",
		bodyClass: "site-content-page page-dark",
	},
	truenas: {
		file: "truenas.html",
		mode: "mainOuter",
		bodyClass: "site-content-page page-dark truenas-page",
	},
	test: {
		file: "test.html",
		mode: "mainOuter",
		bodyClass: "site-content-page page-dark",
	},
	"example-js": {
		file: "example-js.html",
		mode: "mainOuter",
		bodyClass: "site-content-page",
	},
	"email-contact-addresses": {
		file: "email-contact-addresses.html",
		mode: "mainOuter",
		bodyClass: "site-content-page page-dark",
	},
};
