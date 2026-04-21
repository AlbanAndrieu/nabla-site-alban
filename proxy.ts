import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

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
	return intlMiddleware(request);
}

export const config = {
	matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
