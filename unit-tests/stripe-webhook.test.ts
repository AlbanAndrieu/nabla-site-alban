import assert from "node:assert/strict";
import test from "node:test";
import Stripe from "stripe";
import { POST } from "../app/api/stripe/webhook/route";

const secret = "whsec_localSyntheticKeyOnly";
const stripe = new Stripe(
	"sk_test_placeholder_key_not_valid_for_real_requests",
);
const signed = (event: object) => {
	const payload = JSON.stringify(event);
	const signature = stripe.webhooks.generateTestHeaderString({
		payload,
		secret,
	});
	return { payload, signature };
};

function webhookRequest(
	payload: string,
	signature: string | null,
	headers: Record<string, string> = {},
) {
	return new Request("https://example.com/api/stripe/webhook", {
		method: "POST",
		headers: {
			"content-type": "application/json",
			...(signature ? { "stripe-signature": signature } : {}),
			...headers,
		},
		body: payload,
	});
}

// These tests are deliberately serial: the handler reads its secrets from process.env.
test("webhook rejects unsigned or tampered payloads, acknowledges harmless events and never acknowledges payment fulfillment", async () => {
	const previousKey = process.env.STRIPE_SECRET_KEY;
	const previousSecret = process.env.STRIPE_WEBHOOK_SECRET;
	try {
		process.env.STRIPE_SECRET_KEY =
			"sk_test_placeholder_key_not_valid_for_real_requests";
		process.env.STRIPE_WEBHOOK_SECRET = secret;
		const safe = signed({
			id: "evt_synthetic1",
			type: "ping",
			object: "event",
			data: { object: {} },
		});
		assert.equal((await POST(webhookRequest(safe.payload, null))).status, 400);
		assert.equal(
			(await POST(webhookRequest(safe.payload + " ", safe.signature))).status,
			400,
		);
		assert.equal(
			(await POST(webhookRequest(safe.payload, safe.signature))).status,
			200,
		);

		for (const type of [
			"checkout.session.completed",
			"checkout.session.async_payment_succeeded",
			"checkout.session.async_payment_failed",
		]) {
			const payment = signed({
				id: "evt_synthetic2",
				type,
				object: "event",
				data: { object: {} },
			});
			assert.equal(
				(await POST(webhookRequest(payment.payload, payment.signature))).status,
				503,
			);
		}
		assert.equal(
			(
				await POST(
					webhookRequest(safe.payload, safe.signature, {
						"content-type": "text/plain",
					}),
				)
			).status,
			415,
		);
		assert.equal(
			(
				await POST(
					webhookRequest(safe.payload, safe.signature, {
						"content-length": "not-a-number",
					}),
				)
			).status,
			413,
		);
		assert.equal(
			(
				await POST(
					webhookRequest(safe.payload, safe.signature, {
						"content-length": "999999",
					}),
				)
			).status,
			413,
		);
	} finally {
		if (previousKey === undefined) delete process.env.STRIPE_SECRET_KEY;
		else process.env.STRIPE_SECRET_KEY = previousKey;
		if (previousSecret === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
		else process.env.STRIPE_WEBHOOK_SECRET = previousSecret;
	}
});
