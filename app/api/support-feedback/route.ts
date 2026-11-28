import {
	recordSupportFeedback,
	verifyFeedbackToken,
} from "@/lib/server/supportTelemetry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A signed single-answer feedback reference; never accepts a supplied API key. */
export async function POST(request: Request): Promise<Response> {
	if (process.env.SUPPORT_CHAT_ENABLED === "false") {
		return Response.json(
			{ error: "support_disabled" },
			{ status: 503, headers: { "Cache-Control": "no-store" } },
		);
	}
	if (Number(request.headers.get("content-length") || 0) > 2048) {
		return Response.json({ error: "payload_too_large" }, { status: 413 });
	}
	let body: unknown;
	try {
		const text = await request.text();
		if (text.length > 2048) {
			return Response.json({ error: "payload_too_large" }, { status: 413 });
		}
		body = JSON.parse(text);
	} catch {
		return Response.json({ error: "invalid_json" }, { status: 400 });
	}
	if (!body || typeof body !== "object" || Array.isArray(body)) {
		return Response.json({ error: "invalid_body" }, { status: 400 });
	}
	const { traceId, token, relevant } = body as Record<string, unknown>;
	if (typeof relevant !== "boolean") {
		return Response.json({ error: "invalid_rating" }, { status: 400 });
	}
	if (!verifyFeedbackToken(traceId, token)) {
		return Response.json({ error: "invalid_feedback_token" }, { status: 403 });
	}
	const accepted = await recordSupportFeedback(traceId, relevant);
	return accepted
		? Response.json(
				{ status: "recorded" },
				{ status: 202, headers: { "Cache-Control": "no-store" } },
			)
		: Response.json(
				{ error: "rating_unavailable" },
				{ status: 503, headers: { "Cache-Control": "no-store" } },
			);
}
