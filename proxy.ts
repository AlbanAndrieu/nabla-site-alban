import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);
const defaultLocaleRewriteTargets = new Set([
	`/${routing.defaultLocale}`,
	`/${routing.defaultLocale}/checkout`,
	`/${routing.defaultLocale}/checkout-tjm`,
]);

/**
 * Next.js 16+ uses the `proxy` convention (formerly `middleware`).
 * CORS preflight `OPTIONS` is not handled by next-intl routing; forwarding it avoids 400s in dev.
 */
export default function proxy(request: NextRequest) {
	if (request.method === "OPTIONS") {
		return new NextResponse(null, { status: 204 });
	}

	/*
	 * Next.js 16.3 preview can run the proxy again for next-intl's internal
	 * rewrites to default-locale routes. Let the affected internal targets reach
	 * the App Router instead of normalizing them again, which would create 307
	 * redirect loops. Metadata continues to declare unprefixed canonical URLs.
	 */
	if (defaultLocaleRewriteTargets.has(request.nextUrl.pathname)) {
		return NextResponse.next();
	}

	return intlMiddleware(request);
}

export const config = {
	matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
