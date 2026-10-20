import { NextResponse } from "next/server";
import { decideHomelabAccess } from "@/lib/homelabAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Tells the static pages whether to load the private homelab views. It only
 * answers yes/no: the views still fetch every datum from the gated routes.
 */
export async function GET(request: Request) {
	const decision = await decideHomelabAccess(request.headers);
	return NextResponse.json(
		{ trusted: decision.trusted },
		{
			headers: {
				"Cache-Control": "private, no-store, max-age=0",
				Pragma: "no-cache",
				"X-Robots-Tag": "noindex, nofollow",
			},
		},
	);
}
