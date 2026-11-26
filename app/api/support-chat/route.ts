import {
	logSupport,
	readSupportRequest,
	sseToTextStream,
	supportBackendConfig,
	supportUnavailable,
} from "@/lib/server/supportChat";
import { parseChatRequest } from "@/lib/supportChat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE = "support-chat";
const HEADERS_TIMEOUT_MS = 8000;
// Upper bound for the whole streamed answer once headers have arrived.
const STREAM_TIMEOUT_MS = 45_000;

/**
 * Server-side proxy to the Open WebUI `site-support` model behind Cloudflare
 * Access. The system prompt and knowledge base live in Open WebUI; only
 * `user`/`assistant` turns are forwarded. Any backend problem is a 503 so the
 * widget can offer the human contact form.
 */
export async function POST(request: Request): Promise<Response> {
	const startedAt = Date.now();
	const done = (response: Response) => {
		logSupport(ROUTE, response.status, startedAt);
		return response;
	};

	const guarded = await readSupportRequest(request, parseChatRequest);
	if (!guarded.ok) return done(guarded.response);
	const backend = supportBackendConfig();
	if (!backend) return done(supportUnavailable());

	const headersTimeout = new AbortController();
	const timer = setTimeout(() => headersTimeout.abort(), HEADERS_TIMEOUT_MS);
	let upstream: Response;
	try {
		upstream = await fetch(`${backend.url}/api/chat/completions`, {
			method: "POST",
			headers: backend.headers,
			body: JSON.stringify({
				model: backend.model,
				messages: guarded.value.messages,
				stream: true,
				max_tokens: 600,
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
	return done(
		new Response(sseToTextStream(upstream.body), {
			headers: {
				"Content-Type": "text/plain; charset=utf-8",
				"Cache-Control": "no-store",
				"X-Content-Type-Options": "nosniff",
			},
		}),
	);
}
