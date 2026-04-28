/** Leaflet (contact map) — same URL as `public/contact.html`. */
const LEAFLET_CSS =
	"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";

/**
 * Stylesheets each static marketing HTML shell links in `<head>`.
 * The App Router root layout only loads the global stack; `[locale]/[slug]` must
 * add these so injected `<main>` markup matches standalone `public/*.html`.
 */
const SLUG_STYLESHEETS: Record<string, readonly string[]> = {
	contact: ["/landing-sections.css", "wireframe.css", "/theme.css", "/style.css", "/print.css", "/site-content-page.css", "/page-layouts.css", LEAFLET_CSS],
	ai: ["/site-content-page.css", "/arf.css"],
	security: ["/site-content-page.css", "/arf.css", "/page-layouts.css"],
	expertise: ["/site-content-page.css", "/arf.css"],
	workstation: ["/site-content-page.css"],
	startup: ["/site-content-page.css"],
	"startup-thanks": ["/site-content-page.css", "/arf.css"],
	pricing: ["/site-content-page.css"],
	success: ["/site-content-page.css", "/arf.css", "/checkout.css"],
	cancel: ["/site-content-page.css", "/arf.css", "/checkout.css"],
	payment: ["/site-content-page.css", "/checkout.css"],
	ciso: ["/site-content-page.css", "/arf.css", "/page-layouts.css"],
	nabla: [
		"/site-content-page.css",
		"/arf.css",
		"/nabla.css",
		"/opensource.css",
	],
	login: ["/site-content-page.css", "/page-layouts.css"],
	link: ["/site-content-page.css"],
	ctid: ["/site-content-page.css", "/page-layouts.css"],
	freenas: ["/site-content-page.css", "/arf.css"],
	truenas: ["/site-content-page.css", "/arf.css"],
	test: ["/site-content-page.css", "/arf.css"],
	"email-contact-addresses": ["/site-content-page.css"],
};

export function marketingSlugStylesheets(slug: string): readonly string[] {
	return SLUG_STYLESHEETS[slug] ?? ["/site-content-page.css"];
}
