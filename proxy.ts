import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

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
	 * rewrite from `/` to `/en`. Let that internal/default-locale route reach
	 * the App Router instead of normalizing it back to `/`, which would create
	 * a 307 self-redirect loop. Metadata still declares `/` as canonical.
	 */
	if (request.nextUrl.pathname === `/${routing.defaultLocale}`) {
		return NextResponse.next();
	}

	return intlMiddleware(request);
}

export const config = {
	matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
