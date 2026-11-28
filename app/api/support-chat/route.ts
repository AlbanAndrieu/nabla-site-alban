import {
	logSupport,
	readSupportRequest,
	sseToTextStream,
	supportBackendConfig,
	supportUnavailable,
} from "@/lib/server/supportChat";
import { parseChatRequest, supportLanguageHint } from "@/lib/supportChat";
import {
	makeFeedbackToken,
	newSupportTraceId,
	recordSupportTrace,
	SUPPORT_PROMPT,
	SUPPORT_SKILL,
} from "@/lib/server/supportTelemetry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE = "support-chat";
// Measured on the LAN (27/11): 1–7.4 s to first byte warm, over 8 s cold.
const HEADERS_TIMEOUT_MS = 15_000;
// Upper bound for the whole streamed answer once headers have arrived.
const STREAM_TIMEOUT_MS = 45_000;

/**
 * Server-side proxy to the Open WebUI `site-support` model behind Cloudflare
 * Access. The system prompt and knowledge base live in Open WebUI; the visitor's
 * `user`/`assistant` turns are forwarded after one fixed, server-owned
 * language hint (a client `system` role is still refused). Any backend problem is a 503 so the
 * widget can offer the human contact form.
 */
export async function POST(request: Request): Promise<Response> {
	const startedAt = Date.now();
	const done = (response: Response) => {
		logSupport(ROUTE, response.status, startedAt);
		return response;
	};

	// Server-side kill switch: fails before authentication, proxy I/O or model cost.
	if (process.env.SUPPORT_CHAT_ENABLED === "false") {
		return done(Response.json(
			{ error: "support_disabled" },
			{ status: 503, headers: { "Cache-Control": "no-store" } },
		));
	}
	const guarded = await readSupportRequest(request, parseChatRequest);
	if (!guarded.ok) return done(guarded.response);
	const backend = supportBackendConfig();
	if (!backend) return done(supportUnavailable());

	const traceId = newSupportTraceId();
	const token = makeFeedbackToken(traceId);
	const headersTimeout = new AbortController();
	const timer = setTimeout(() => headersTimeout.abort(), HEADERS_TIMEOUT_MS);
	let upstream: Response;
	try {
		upstream = await fetch(`${backend.url}/api/chat/completions`, {
			method: "POST",
			headers: backend.headers,
			body: JSON.stringify({
				model: backend.model,
				messages: [
					{
						role: "system",
						content: supportLanguageHint(guarded.value.locale),
					},
					...guarded.value.messages,
				],
				stream: true,
				max_tokens: 600,
				// Open WebUI may retain metadata for filters. Independent Langfuse
				// OTLP records are the authoritative website trace.
				metadata: {
					trace_id: traceId,
					source: "albanandrieu-support",
					prompt: SUPPORT_PROMPT,
					skill: SUPPORT_SKILL,
				},
			}),
			cache: "no-store",
			// An Access login redirect means the service token was refused.
			redirect: "error",
			signal: AbortSignal.any([
				headersTimeout.signal,
				AbortSignal.timeout(STREAM_TIMEOUT_MS),
			]),
		});
	} catch {
		return done(supportUnavailable());
	} finally {
		clearTimeout(timer);
	}
	if (!upstream.ok || !upstream.body) {
		await upstream.body?.cancel().catch(() => undefined);
		return done(supportUnavailable());
	}
	// Keep streaming to the visitor. A final OTLP event records the exact
	// prompt, skill and visible reply under the same ID as the feedback score.
	const reader = sseToTextStream(upstream.body).getReader();
	const decoder = new TextDecoder();
	const completedAtStart = startedAt;
	let answer = "";
	const tracedStream = new ReadableStream<Uint8Array>({
		async pull(controller) {
			try {
				const chunk = await reader.read();
				if (chunk.done) {
					answer += decoder.decode();
					await recordSupportTrace({
						traceId,
						startedAt: completedAtStart,
						completedAt: Date.now(),
						locale: guarded.value.locale,
						messages: guarded.value.messages,
						output: answer,
						result: answer.trim() ? "complete" : "incomplete",
					});
					controller.close();
					return;
				}
				answer += decoder.decode(chunk.value, { stream: true });
				controller.enqueue(chunk.value);
			} catch {
				controller.error(new Error("support_stream_unavailable"));
			}
		},
		cancel(reason) {
			return reader.cancel(reason);
		},
	});
	const headers: Record<string, string> = {
		"Content-Type": "text/plain; charset=utf-8",
		"Cache-Control": "no-store",
		"X-Content-Type-Options": "nosniff",
		"X-Support-Trace-Id": traceId,
	};
	if (token && process.env.SUPPORT_LANGFUSE_PUBLIC_KEY && process.env.SUPPORT_LANGFUSE_SECRET_KEY) {
		headers["X-Support-Feedback-Token"] = token;
	}
	return done(new Response(tracedStream, { headers }));
}
