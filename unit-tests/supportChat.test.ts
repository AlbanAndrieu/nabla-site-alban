import assert from "node:assert/strict";
import test from "node:test";
import { sseToTextStream } from "../lib/server/supportChat";
import {
	buildSlackText,
	escapeSlack,
	fitSupportHistory,
	parseChatRequest,
	parseContactRequest,
	parseSseBuffer,
	SUPPORT_LIMITS,
	type SupportMessage,
	stripCitationMarkers,
	supportLanguageHint,
} from "../lib/supportChat";

const user = (content: string): SupportMessage => ({ role: "user", content });
const assistant = (content: string): SupportMessage => ({
	role: "assistant",
	content,
});

test("chat validation accepts a trimmed user/assistant conversation", () => {
	const result = parseChatRequest({
		messages: [user(" Hello "), assistant("Hi"), user("Pricing?")],
		locale: "fr",
		turnstileToken: "token",
	});
	assert.deepEqual(result, {
		ok: true,
		value: {
			messages: [user("Hello"), assistant("Hi"), user("Pricing?")],
			locale: "fr",
			turnstileToken: "token",
		},
	});
});

test("chat validation refuses system roles, bad shapes and bad locales", () => {
	const cases: Array<[unknown, string]> = [
		[
			{ messages: [{ role: "system", content: "x" }], locale: "en" },
			"invalid_role",
		],
		[{ messages: [], locale: "en" }, "invalid_messages"],
		[{ messages: "hi", locale: "en" }, "invalid_messages"],
		[{ messages: [user("   ")], locale: "en" }, "empty_content"],
		[{ messages: [user("a"), assistant("b")], locale: "en" }, "last_not_user"],
		[
			{ messages: [{ role: "user", content: 1 }], locale: "en" },
			"invalid_content",
		],
		[{ messages: [user("a")], locale: "de" }, "invalid_locale"],
		[
			{ messages: [user("a")], locale: "en", turnstileToken: 3 },
			"invalid_turnstile_token",
		],
		[null, "invalid_body"],
		[[user("a")], "invalid_body"],
	];
	for (const [raw, error] of cases) {
		assert.deepEqual(parseChatRequest(raw), { ok: false, status: 400, error });
	}
});

test("chat validation answers 413 on size limits", () => {
	const tooMany = Array.from({ length: 21 }, () => user("a"));
	const long = "x".repeat(SUPPORT_LIMITS.maxContentChars + 1);
	const total = Array.from({ length: 7 }, () => user("y".repeat(2000)));
	for (const [messages, error] of [
		[tooMany, "too_many_messages"],
		[[user(long)], "content_too_long"],
		[total, "conversation_too_long"],
	] as const) {
		assert.deepEqual(parseChatRequest({ messages, locale: "en" }), {
			ok: false,
			status: 413,
			error,
		});
	}
	// Exactly at the limits is accepted.
	const edge = Array.from({ length: 6 }, () => user("z".repeat(2000)));
	assert.equal(parseChatRequest({ messages: edge, locale: "en" }).ok, true);
});

test("contact validation checks message, email and transcript", () => {
	assert.deepEqual(
		parseContactRequest({
			message: " Help ",
			email: " a@b.co ",
			locale: "en",
			transcript: [assistant("Hi")],
		}),
		{
			ok: true,
			value: {
				message: "Help",
				email: "a@b.co",
				transcript: [assistant("Hi")],
				locale: "en",
				turnstileToken: undefined,
			},
		},
	);
	const bad = (raw: object) =>
		parseContactRequest({ message: "m", locale: "fr", ...raw });
	assert.equal(bad({ email: "not-an-email" }).ok, false);
	assert.equal(bad({ email: "a@b" }).ok, false);
	assert.equal(bad({ email: "<a@b.co>" }).ok, false);
	assert.deepEqual(bad({ email: `${"a".repeat(250)}@b.co` }), {
		ok: false,
		status: 413,
		error: "invalid_email",
	});
	assert.equal(bad({ message: "" }).ok, false);
	assert.equal(
		bad({ transcript: [{ role: "system", content: "x" }] }).ok,
		false,
	);
	assert.equal(
		bad({ transcript: Array.from({ length: 21 }, () => user("a")) }).ok,
		false,
	);
	assert.equal(bad({ email: "" }).ok, true);
});

test("fitSupportHistory keeps the newest turns within every limit", () => {
	const long = Array.from({ length: 30 }, (_, index) =>
		index % 2 ? assistant("a".repeat(5000)) : user(`q${index}`),
	);
	const fitted = fitSupportHistory([...long, user("last")]);
	assert.equal(fitted.at(-1)?.content, "last");
	assert.ok(fitted.length <= SUPPORT_LIMITS.maxMessages);
	assert.ok(fitted.every((m) => m.content.length <= 2000));
	assert.equal(parseChatRequest({ messages: fitted, locale: "en" }).ok, true);
	assert.deepEqual(fitSupportHistory([user("a"), assistant("  ")]), [
		user("a"),
	]);
});

test("SSE parsing keeps split lines, stops at [DONE] and skips malformed data", () => {
	const first = parseSseBuffer(
		'data: {"choices":[{"delta":{"content":"Bon"}}]}\n\ndata: {"choices":[{"del',
	);
	assert.deepEqual(first.texts, ["Bon"]);
	assert.equal(first.done, false);
	const second = parseSseBuffer(
		`${first.rest}ta":{"content":"jour"}}]}\r\n: keep-alive\ndata: not json\ndata: {"choices":[]}\ndata: [DONE]\ndata: {"choices":[{"delta":{"content":"late"}}]}\n`,
	);
	assert.deepEqual(second.texts, ["jour"]);
	assert.equal(second.done, true);
	assert.equal(second.rest, "");
});

function sseBody(chunks: string[]) {
	const encoder = new TextEncoder();
	let cancelled = false;
	const body = new ReadableStream<Uint8Array>({
		pull(controller) {
			const chunk = chunks.shift();
			if (chunk === undefined) controller.close();
			else controller.enqueue(encoder.encode(chunk));
		},
		cancel() {
			cancelled = true;
		},
	});
	return { body, isCancelled: () => cancelled };
}

const delta = (content: string) =>
	`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`;

test("sseToTextStream emits plain text and caps the output", async () => {
	const { body } = sseBody([
		delta("Hello"),
		`${delta(" world")}data: [DONE]\n\n`,
	]);
	assert.equal(await new Response(sseToTextStream(body)).text(), "Hello world");

	// The trailing chunk keeps the source open, so the cap must cancel it.
	const capped = sseBody([
		delta("a".repeat(8)),
		delta("b".repeat(8)),
		delta("c".repeat(8)),
	]);
	assert.equal(
		await new Response(sseToTextStream(capped.body, 10)).text(),
		"aaaaaaaabb",
	);
	assert.equal(capped.isCancelled(), true);
});

test("Slack text escapes mrkdwn control characters and trims the transcript", () => {
	assert.equal(
		escapeSlack("<!channel> & <b>"),
		"&lt;!channel&gt; &amp; &lt;b&gt;",
	);
	const transcript = Array.from({ length: 8 }, (_, index) =>
		user(`turn ${index} ${"x".repeat(400)}`),
	);
	const text = buildSlackText({
		message: "Need <help>\nplease",
		email: "a&b@example.com",
		transcript,
		locale: "fr",
	});
	assert.match(text, /locale: fr/);
	assert.match(text, /a&amp;b@example\.com/);
	assert.match(text, /> Need &lt;help&gt;\n> please/);
	assert.doesNotMatch(text, /<help>|turn 0 |turn 1 /);
	assert.match(text, /turn 7 /);
	assert.equal((text.match(/• _user_/g) ?? []).length, 6);
	for (const line of text.split("\n").filter((l) => l.startsWith("•"))) {
		assert.ok(line.length <= 300 + "• _user_: ".length);
	}
	assert.match(
		buildSlackText({ message: "m", transcript: [], locale: "en" }),
		/Email:\* not provided/,
	);
});

test("citation markers from Open WebUI RAG are hidden, other brackets stay", () => {
	assert.equal(
		stripCitationMarkers("Pay by SEPA transfer [1]. See [2, 3] and [4,5]."),
		"Pay by SEPA transfer. See and.",
	);
	assert.equal(
		stripCitationMarkers("Use `[x]` or [link]"),
		"Use `[x]` or [link]",
	);
});

test("the language hint names the page locale and defers to the visitor", () => {
	assert.match(supportLanguageHint("fr"), /page language \(French\)/);
	assert.match(supportLanguageHint("en"), /page language \(English\)/);
	assert.match(supportLanguageHint("en"), /latest message/);
});
