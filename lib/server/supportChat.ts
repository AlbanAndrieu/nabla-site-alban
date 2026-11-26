import {
	parseSseBuffer,
	SUPPORT_LIMITS,
	type SupportResult,
} from "@/lib/supportChat";

const TURNSTILE_VERIFY_URL =
	"https://challenges.cloudflare.com/turnstile/v0/siteverify";
const DEFAULT_OPENWEBUI_URL = "https://openwebui.albandrieu.com";
const DEFAULT_MODEL = "site-support";
// An SSE line longer than this is not a chat delta: stop instead of buffering.
const MAX_SSE_LINE_CHARS = 64_000;

export function supportJson(body: unknown, status: number): Response {
	return Response.json(body, {
		status,
		headers: { "Cache-Control": "no-store" },
	});
}

export const supportUnavailable = () =>
	supportJson({ error: "support_unavailable" }, 503);

/** Status and duration only: never message contents, tokens or secrets. */
export function logSupport(route: string, status: number, startedAt: number) {
	console.info(`[${route}]`, { status, ms: Date.now() - startedAt });
}

/** First hop of `x-forwarded-for`, as set by the Vercel edge. */
function clientIp(request: Request): string | undefined {
	return (
		request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined
	);
}

/** Fail closed: a network error or a malformed answer is a refusal. */
async function verifyTurnstile(
	secret: string,
	token: string | undefined,
	remoteIp: string | undefined,
): Promise<boolean> {
	if (!token) return false;
	const form = new URLSearchParams({ secret, response: token });
	if (remoteIp) form.set("remoteip", remoteIp);
	try {
		const response = await fetch(TURNSTILE_VERIFY_URL, {
			method: "POST",
			body: form,
			cache: "no-store",
			signal: AbortSignal.timeout(5000),
		});
		if (!response.ok) return false;
		const result = (await response.json()) as { success?: unknown };
		return result.success === true;
	} catch {
		return false;
	}
}

/**
 * Read, size-check and validate a JSON body, then enforce Turnstile when
 * `SUPPORT_TURNSTILE_SECRET_KEY` is set (unset on previews: no check).
 */
export async function readSupportRequest<T extends { turnstileToken?: string }>(
	request: Request,
	parse: (raw: unknown) => SupportResult<T>,
): Promise<{ ok: true; value: T } | { ok: false; response: Response }> {
	const reject = (error: string, status: number) => ({
		ok: false as const,
		response: supportJson({ error }, status),
	});
	if (
		Number(request.headers.get("content-length") ?? 0) >
		SUPPORT_LIMITS.maxBodyBytes
	)
		return reject("payload_too_large", 413);
	let raw: unknown;
	try {
		const text = await request.text();
		if (text.length > SUPPORT_LIMITS.maxBodyBytes)
			return reject("payload_too_large", 413);
		raw = JSON.parse(text);
	} catch {
		return reject("invalid_json", 400);
	}
	const parsed = parse(raw);
	if (!parsed.ok) return reject(parsed.error, parsed.status);
	const secret = process.env.SUPPORT_TURNSTILE_SECRET_KEY;
	if (
		secret &&
		!(await verifyTurnstile(
			secret,
			parsed.value.turnstileToken,
			clientIp(request),
		))
	)
		return reject("turnstile_failed", 403);
	return { ok: true, value: parsed.value };
}

type SupportBackend = {
	url: string;
	model: string;
	headers: Record<string, string>;
};

/** Null when any credential is missing: the route then answers 503. */
export function supportBackendConfig(): SupportBackend | null {
	const apiKey = process.env.SUPPORT_OPENWEBUI_API_KEY;
	const accessId = process.env.SUPPORT_CF_ACCESS_CLIENT_ID;
	const accessSecret = process.env.SUPPORT_CF_ACCESS_CLIENT_SECRET;
	if (!apiKey || !accessId || !accessSecret) return null;
	return {
		url: (process.env.SUPPORT_OPENWEBUI_URL || DEFAULT_OPENWEBUI_URL).replace(
			/\/+$/,
			"",
		),
		model: process.env.SUPPORT_OPENWEBUI_MODEL || DEFAULT_MODEL,
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"CF-Access-Client-Id": accessId,
			"CF-Access-Client-Secret": accessSecret,
			"Content-Type": "application/json",
			Accept: "text/event-stream",
		},
	};
}

/**
 * Turn the upstream OpenAI SSE body into plain text, capped at
 * `maxChars`. The upstream body is cancelled once the cap or `[DONE]` is
 * reached, and when the visitor disconnects.
 */
export function sseToTextStream(
	body: ReadableStream<Uint8Array>,
	maxChars: number = SUPPORT_LIMITS.maxOutputChars,
): ReadableStream<Uint8Array> {
	const reader = body.getReader();
	const decoder = new TextDecoder();
	const encoder = new TextEncoder();
	let buffer = "";
	let sent = 0;
	return new ReadableStream<Uint8Array>({
		async pull(controller) {
			for (;;) {
				const { value, done } = await reader.read();
				if (done) {
					controller.close();
					return;
				}
				const parsed = parseSseBuffer(
					buffer + decoder.decode(value, { stream: true }),
				);
				buffer = parsed.rest;
				const text = parsed.texts.join("").slice(0, maxChars - sent);
				sent += text.length;
				if (text) controller.enqueue(encoder.encode(text));
				if (
					parsed.done ||
					sent >= maxChars ||
					buffer.length > MAX_SSE_LINE_CHARS
				) {
					await reader.cancel().catch(() => undefined);
					controller.close();
					return;
				}
				if (text) return;
			}
		},
		cancel(reason) {
			return reader.cancel(reason);
		},
	});
}
