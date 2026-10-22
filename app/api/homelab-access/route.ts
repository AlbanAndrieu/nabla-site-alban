import { NextResponse } from "next/server";
import { decideHomelabAccess } from "@/lib/homelabAccess";
import { diagnoseHomelabAccessNetwork } from "@/lib/homelabAccessDiagnostics";
import { publicRemoteReadOnlyEnabled } from "@/lib/remoteHomelabReadOnly";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Tells the static pages whether to load the private homelab views. It only
 * answers yes/no: the views still fetch every datum from the gated routes.
 */
export async function GET(request: Request) {
	const decision = await decideHomelabAccess(request.headers);
	const publicReadOnly = publicRemoteReadOnlyEnabled();
	// Explicit, per-request diagnostics only. Never expose the source IP,
	// allowed CIDRs, JWT contents, internal topology or proxy headers.
	const diagnose = new URL(request.url).searchParams.get("diagnose") === "1";
	const body = diagnose
		? {
				trusted: decision.trusted || publicReadOnly,
				...(publicReadOnly && !decision.trusted ? { mode: "public-readonly" } : {}),
				diagnostic: diagnoseHomelabAccessNetwork(
					request.headers,
					process.env,
					decision.trusted,
				),
			}
		: publicReadOnly && !decision.trusted
			? { trusted: true, mode: "public-readonly" }
			: { trusted: decision.trusted };
	return NextResponse.json(body, {
		headers: {
			"Cache-Control": "private, no-store, max-age=0",
			Pragma: "no-cache",
			"X-Robots-Tag": "noindex, nofollow",
		},
	});
}
