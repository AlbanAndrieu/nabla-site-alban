import {
	logSupport,
	readSupportRequest,
	supportJson,
	supportUnavailable,
} from "@/lib/server/supportChat";
import { buildSlackText, parseContactRequest } from "@/lib/supportChat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE = "support-contact";

/** Escalation to a human: a short Slack message, nothing stored by the site. */
export async function POST(request: Request): Promise<Response> {
	const startedAt = Date.now();
	const done = (response: Response) => {
		logSupport(ROUTE, response.status, startedAt);
		return response;
	};

	const guarded = await readSupportRequest(request, parseContactRequest);
	if (!guarded.ok) return done(guarded.response);
	const webhook = process.env.SUPPORT_SLACK_WEBHOOK_URL;
	if (!webhook) return done(supportUnavailable());

	try {
		const response = await fetch(webhook, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				text: buildSlackText(guarded.value),
				// Visitor-supplied URLs must not make Slack fetch them.
				unfurl_links: false,
				unfurl_media: false,
			}),
			cache: "no-store",
			redirect: "error",
			signal: AbortSignal.timeout(5000),
		});
		if (!response.ok) return done(supportUnavailable());
	} catch {
		return done(supportUnavailable());
	}
	return done(supportJson({ status: "sent" }, 202));
}
