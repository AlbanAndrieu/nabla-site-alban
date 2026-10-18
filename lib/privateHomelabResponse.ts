import { NextResponse } from "next/server";

/** The public site must not proxy owner-only operational evidence. */
export function privateHomelabResponse() {
	return NextResponse.json(
		{ error: "Operational homelab data is private" },
		{
			status: 404,
			headers: {
				"Cache-Control": "private, no-store, max-age=0",
				Pragma: "no-cache",
				"X-Robots-Tag": "noindex, nofollow",
			},
		},
	);
}
