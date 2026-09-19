import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";
import {
	HTML_ROUTE_SLUGS,
	SEO_HTML_MIGRATION_SLUGS,
} from "@/lib/htmlRoutes.config.mjs";

const intlMiddleware = createMiddleware(routing);
const defaultLocalePrefix = `/${routing.defaultLocale}`;
const knownTopLevelHtmlPaths = new Set([
	...HTML_ROUTE_SLUGS.map((slug) => `/${slug}.html`),
	...SEO_HTML_MIGRATION_SLUGS.map((slug) => `/${slug}.html`),
	"/index.html",
	"/checkout.html",
	"/checkout-tjm.html",
]);

function isUnknownTopLevelHtml(pathname: string): boolean {
	return /^\/[^/]+\.html$/.test(pathname) && !knownTopLevelHtmlPaths.has(pathname);
}

/**
 * Next.js 16+ uses the `proxy` convention (formerly `middleware`).
 * CORS preflight `OPTIONS` is not handled by next-intl routing; forwarding it avoids 400s in dev.
 */
export default function proxy(request: NextRequest) {
	if (request.method === "OPTIONS") {
		return new NextResponse(null, { status: 204 });
	}

	/*
	 * A config rewrite to /404 renders the right document but preserves HTTP
	 * 200. Intercept only unresolved top-level HTML compatibility URLs here so
	 * the custom global not-found document keeps its semantic 404 response.
	 * Known legacy/SEO/public HTML paths continue through normal Next routing.
	 */
	if (isUnknownTopLevelHtml(request.nextUrl.pathname)) {
		const notFoundUrl = request.nextUrl.clone();
		notFoundUrl.pathname = "/404";
		return NextResponse.rewrite(notFoundUrl, { status: 404 });
	}

	/*
	 * Next.js 16.3 preview can run the proxy again for next-intl's internal
	 * rewrites to default-locale routes. Let the affected internal targets reach
	 * the App Router instead of normalizing them again, which would create 307
	 * redirect loops. Metadata continues to declare unprefixed canonical URLs.
	 */
	if (
		request.nextUrl.pathname === defaultLocalePrefix ||
		request.nextUrl.pathname.startsWith(`${defaultLocalePrefix}/`)
	) {
		return NextResponse.next();
	}

	return intlMiddleware(request);
}

export const config = {
	matcher: [
		"/:slug.html",
		"/((?!api|_next|_vercel|.*\\..*).*)",
	],
};
