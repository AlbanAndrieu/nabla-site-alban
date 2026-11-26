/**
 * Pure helpers for the support chatbot (validation, SSE parsing, Slack text).
 * Shared by the API routes and the client widget; no I/O, no secrets.
 */

export type SupportLocale = "fr" | "en";
export type SupportMessage = { role: "user" | "assistant"; content: string };

export const SUPPORT_LIMITS = {
	maxMessages: 20,
	maxContentChars: 2000,
	maxTotalChars: 12000,
	maxOutputChars: 6000,
	maxEmailChars: 254,
	maxTokenChars: 2048,
	maxBodyBytes: 64_000,
	slackTurns: 6,
	slackTurnChars: 300,
} as const;

type Invalid = { ok: false; status: 400 | 413; error: string };
type Valid<T> = { ok: true; value: T };
export type SupportResult<T> = Valid<T> | Invalid;

export type SupportChatRequest = {
	messages: SupportMessage[];
	locale: SupportLocale;
	turnstileToken?: string;
};

export type SupportContactRequest = {
	message: string;
	email?: string;
	transcript: SupportMessage[];
	locale: SupportLocale;
	turnstileToken?: string;
};

const invalid = (error: string, status: 400 | 413 = 400): Invalid => ({
	ok: false,
	status,
	error,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

function parseLocale(value: unknown): SupportLocale | null {
	return value === "fr" || value === "en" ? value : null;
}

function parseToken(value: unknown): SupportResult<string | undefined> {
	if (value === undefined || value === null || value === "")
		return { ok: true, value: undefined };
	if (typeof value !== "string") return invalid("invalid_turnstile_token");
	if (value.length > SUPPORT_LIMITS.maxTokenChars)
		return invalid("invalid_turnstile_token", 413);
	return { ok: true, value };
}

/** Only `user` and `assistant` roles pass: a client `system` prompt is refused. */
function parseMessages(
	raw: unknown,
	{ requireUserLast }: { requireUserLast: boolean },
): SupportResult<SupportMessage[]> {
	if (!Array.isArray(raw)) return invalid("invalid_messages");
	if (raw.length > SUPPORT_LIMITS.maxMessages)
		return invalid("too_many_messages", 413);
	const messages: SupportMessage[] = [];
	let total = 0;
	for (const item of raw) {
		if (!isRecord(item)) return invalid("invalid_message");
		const { role, content } = item;
		if (role !== "user" && role !== "assistant") return invalid("invalid_role");
		if (typeof content !== "string") return invalid("invalid_content");
		const trimmed = content.trim();
		if (!trimmed) return invalid("empty_content");
		if (trimmed.length > SUPPORT_LIMITS.maxContentChars)
			return invalid("content_too_long", 413);
		total += trimmed.length;
		messages.push({ role, content: trimmed });
	}
	if (total > SUPPORT_LIMITS.maxTotalChars)
		return invalid("conversation_too_long", 413);
	if (requireUserLast) {
		if (messages.length === 0) return invalid("invalid_messages");
		if (messages.at(-1)?.role !== "user") return invalid("last_not_user");
	}
	return { ok: true, value: messages };
}

export function parseChatRequest(
	raw: unknown,
): SupportResult<SupportChatRequest> {
	if (!isRecord(raw)) return invalid("invalid_body");
	const locale = parseLocale(raw.locale);
	if (!locale) return invalid("invalid_locale");
	const messages = parseMessages(raw.messages, { requireUserLast: true });
	if (!messages.ok) return messages;
	const token = parseToken(raw.turnstileToken);
	if (!token.ok) return token;
	return {
		ok: true,
		value: { messages: messages.value, locale, turnstileToken: token.value },
	};
}

// Deliberately simple: one @, no whitespace or angle brackets, a dotted domain.
const EMAIL_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

export function parseContactRequest(
	raw: unknown,
): SupportResult<SupportContactRequest> {
	if (!isRecord(raw)) return invalid("invalid_body");
	const locale = parseLocale(raw.locale);
	if (!locale) return invalid("invalid_locale");
	if (typeof raw.message !== "string") return invalid("invalid_message");
	const message = raw.message.trim();
	if (!message) return invalid("empty_message");
	if (message.length > SUPPORT_LIMITS.maxContentChars)
		return invalid("message_too_long", 413);
	let email: string | undefined;
	if (raw.email !== undefined && raw.email !== null && raw.email !== "") {
		if (typeof raw.email !== "string") return invalid("invalid_email");
		email = raw.email.trim();
		if (email.length > SUPPORT_LIMITS.maxEmailChars)
			return invalid("invalid_email", 413);
		if (!EMAIL_PATTERN.test(email)) return invalid("invalid_email");
	}
	const transcript = parseMessages(raw.transcript ?? [], {
		requireUserLast: false,
	});
	if (!transcript.ok) return transcript;
	const token = parseToken(raw.turnstileToken);
	if (!token.ok) return token;
	return {
		ok: true,
		value: {
			message,
			email,
			transcript: transcript.value,
			locale,
			turnstileToken: token.value,
		},
	};
}

/**
 * Keep the newest turns that satisfy the request limits, so a long
 * conversation never turns into a 413. Assistant answers can reach
 * `maxOutputChars`, hence the per-message truncation.
 */
export function fitSupportHistory(all: SupportMessage[]): SupportMessage[] {
	const fitted: SupportMessage[] = [];
	let total = 0;
	for (let index = all.length - 1; index >= 0; index -= 1) {
		if (fitted.length === SUPPORT_LIMITS.maxMessages) break;
		const content = all[index].content
			.trim()
			.slice(0, SUPPORT_LIMITS.maxContentChars)
			.trim();
		if (!content) continue;
		if (total + content.length > SUPPORT_LIMITS.maxTotalChars) break;
		total += content.length;
		fitted.unshift({ role: all[index].role, content });
	}
	return fitted;
}

/**
 * Parse complete OpenAI SSE lines from `buffer`. The unterminated tail is
 * returned as `rest` so a chunk split mid-line is completed by the next one.
 * Malformed lines are skipped rather than aborting the answer.
 */
export function parseSseBuffer(buffer: string): {
	texts: string[];
	rest: string;
	done: boolean;
} {
	const lines = buffer.split("\n");
	const rest = lines.pop() ?? "";
	const texts: string[] = [];
	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (!line.startsWith("data:")) continue;
		const data = line.slice(5).trim();
		if (data === "[DONE]") return { texts, rest: "", done: true };
		try {
			const content = JSON.parse(data)?.choices?.[0]?.delta?.content;
			if (typeof content === "string" && content) texts.push(content);
		} catch {
			// Not JSON (keep-alive comment, partial proxy output): ignore.
		}
	}
	return { texts, rest, done: false };
}

/** Slack mrkdwn requires exactly these three escapes; it also defuses `<!channel>`. */
export function escapeSlack(text: string): string {
	return text
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;");
}

function truncate(text: string, max: number): string {
	return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function buildSlackText({
	message,
	email,
	transcript,
	locale,
}: Pick<
	SupportContactRequest,
	"message" | "email" | "transcript" | "locale"
>): string {
	const quote = (text: string) =>
		escapeSlack(text)
			.split("\n")
			.map((line) => `> ${line}`)
			.join("\n");
	const lines = [
		`*Site support: a visitor asked for a human* (locale: ${locale})`,
		`*Email:* ${email ? escapeSlack(email) : "not provided"}`,
		"*Message:*",
		quote(message),
	];
	const turns = transcript.slice(-SUPPORT_LIMITS.slackTurns);
	if (turns.length > 0) {
		lines.push(`*Last ${turns.length} chatbot turns:*`);
		for (const turn of turns) {
			const text = truncate(
				turn.content.replace(/\s+/g, " "),
				SUPPORT_LIMITS.slackTurnChars,
			);
			lines.push(`• _${turn.role}_: ${escapeSlack(text)}`);
		}
	}
	return lines.join("\n");
}
