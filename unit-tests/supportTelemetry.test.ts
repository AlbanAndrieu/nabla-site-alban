import assert from "node:assert/strict";
import test from "node:test";
import {
	buildSupportOtelPayload,
	makeFeedbackToken,
	newSupportTraceId,
	SUPPORT_PROMPT,
	SUPPORT_SKILL,
	verifyFeedbackToken,
} from "../lib/server/supportTelemetry";
import { supportCitationSegments } from "../lib/supportChat";
import { POST as feedbackPost } from "../app/api/support-feedback/route";
import { POST as chatPost } from "../app/api/support-chat/route";

test("support traces use 32-char W3C IDs and label prompt, skill and model", () => {
	const traceId = newSupportTraceId();
	assert.match(traceId, /^[0-9a-f]{32}$/);
	const payload = buildSupportOtelPayload({
		traceId,
		startedAt: 1_000,
		completedAt: 2_000,
		locale: "fr",
		messages: [{ role: "user", content: "Bonjour" }],
		output: "Consultez la page de contact.",
		result: "complete",
	});
	const span = payload.resourceSpans[0].scopeSpans[0].spans[0];
	assert.equal(span.traceId, traceId);
	assert.equal(span.startTimeUnixNano, "1000000000");
	assert.equal(span.endTimeUnixNano, "2000000000");
	const attributes = new Map(
		span.attributes.map(({ key, value }) => [key, value.stringValue]),
	);
	assert.equal(attributes.get("langfuse.trace.metadata.prompt"), SUPPORT_PROMPT);
	assert.equal(attributes.get("langfuse.trace.metadata.skill"), SUPPORT_SKILL);
	assert.equal(attributes.get("langfuse.observation.type"), "span");
	assert.match(attributes.get("langfuse.observation.output") ?? "", /contact/);
});

test("signed visitor ratings cannot forge another trace or survive expiry", () => {
	const old = process.env.SUPPORT_FEEDBACK_SIGNING_KEY;
	process.env.SUPPORT_FEEDBACK_SIGNING_KEY = "test-key-not-a-production-secret";
	try {
		const traceId = newSupportTraceId();
		const issued = Math.floor(Date.now() / 1000);
		const token = makeFeedbackToken(traceId, issued);
		assert.ok(token);
		assert.equal(verifyFeedbackToken(traceId, token), true);
		assert.equal(verifyFeedbackToken(newSupportTraceId(), token), false);
		assert.equal(
			verifyFeedbackToken(traceId, makeFeedbackToken(traceId, issued - 90_000)),
			false,
		);
		assert.equal(verifyFeedbackToken("000", token), false);
		assert.equal(verifyFeedbackToken(traceId, token + "f"), false);
	} finally {
		if (old === undefined) delete process.env.SUPPORT_FEEDBACK_SIGNING_KEY;
		else process.env.SUPPORT_FEEDBACK_SIGNING_KEY = old;
	}
});

test("chatbot citations link only approved HTTPS public sources", () => {
	const parts = supportCitationSegments(
		"See [Pricing](https://www.albanandrieu.com/fr/pricing). [X](https://attacker.example) [1]",
	);
	assert.equal(parts.filter((x) => x.href).length, 1);
	assert.equal(
		parts.find((x) => x.href)?.href,
		"https://www.albanandrieu.com/fr/pricing",
	);
	assert.ok(parts.some((x) => x.text.includes("attacker.example") && !x.href));
	assert.ok(!parts.some((x) => x.text.includes("[1]")));
});

test("kill switch stops inference before Turnstile, OpenWebUI or Langfuse", async () => {
	const old = process.env.SUPPORT_CHAT_ENABLED;
	process.env.SUPPORT_CHAT_ENABLED = "false";
	try {
		const request = new Request("https://www.albanandrieu.com/api/support-chat", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ locale: "fr", messages: [{ role: "user", content: "Salut" }] }),
		});
		const blocked = await chatPost(request);
		assert.equal(blocked.status, 503);
		assert.deepEqual(await blocked.json(), { error: "support_disabled" });
		const feedback = await feedbackPost(new Request(
			"https://www.albanandrieu.com/api/support-feedback", { method: "POST" },
		));
		assert.equal(feedback.status, 503);
	} finally {
		if (old === undefined) delete process.env.SUPPORT_CHAT_ENABLED;
		else process.env.SUPPORT_CHAT_ENABLED = old;
	}
});

test("feedback API rejects forged IDs without contacting Langfuse", async () => {
	const old = process.env.SUPPORT_CHAT_ENABLED;
	delete process.env.SUPPORT_CHAT_ENABLED;
	try {
		const response = await feedbackPost(new Request(
			"https://www.albanandrieu.com/api/support-feedback",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ traceId: newSupportTraceId(), token: "fake", relevant: true }),
			},
		));
		assert.equal(response.status, 403);
	} finally {
		if (old !== undefined) process.env.SUPPORT_CHAT_ENABLED = old;
	}
});
