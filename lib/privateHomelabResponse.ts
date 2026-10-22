import { NextResponse } from "next/server";
import { isTrustedHomelabRequest } from "./homelabAccess";
import { allowPublicHomelabProjection } from "./remoteHomelabReadOnly";

const PRIVATE_HEADERS = {
	"Cache-Control": "private, no-store, max-age=0",
	Pragma: "no-cache",
	"X-Robots-Tag": "noindex, nofollow",
} as const;

/** The public site must not proxy owner-only operational evidence. */
export function privateHomelabResponse() {
	return NextResponse.json(
		{ error: "Operational homelab data is private" },
		{ status: 404, headers: PRIVATE_HEADERS },
	);
}

/**
 * Serve owner-only homelab data to trusted requests (owner network or verified
 * Cloudflare Access) and a neutral 404 to everyone else.
 *
 * Any upstream cache directive is overridden: the CDN cache key does not
 * include the client address, so a shared-cacheable trusted response would be
 * replayed to the public and bypass this gate.
 */
export async function gatedHomelabResponse(
	request: Request,
	handler: () => Promise<Response>,
): Promise<Response> {
	if (!allowPublicHomelabProjection(request) && !(await isTrustedHomelabRequest(request))) {
		return privateHomelabResponse();
	}
	const response = await handler();
	for (const [name, value] of Object.entries(PRIVATE_HEADERS)) {
		response.headers.set(name, value);
	}
	return response;
}
