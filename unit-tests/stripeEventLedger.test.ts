import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import type Stripe from "stripe";
import { recordStripeEvent, type SqlTag } from "../lib/stripeEventLedger";

/** In-memory stand-in for the PRIMARY KEY of stripe_webhook_events. */
function fakeLedger() {
	const ids = new Set<string>();
	const calls: { text: string; values: unknown[] }[] = [];
	const sql: SqlTag = async (strings, ...values) => {
		calls.push({ text: strings.join("$"), values });
		const id = String(values[0]);
		if (ids.has(id)) return [];
		ids.add(id);
		return [{ id }];
	};
	return { sql, calls };
}

const paidEvent = {
	id: "evt_synthetic_paid",
	object: "event",
	type: "checkout.session.completed",
	created: 1_795_000_000,
	livemode: false,
	data: {
		object: {
			id: "cs_test_synthetic",
			object: "checkout.session",
			customer_details: { email: "buyer@example.com", name: "Synthetic Buyer" },
			payment_method_types: ["card"],
		},
	},
} as unknown as Stripe.Event;

test("first delivery is recorded, a redelivery is a duplicate", async () => {
	const { sql, calls } = fakeLedger();
	assert.equal(await recordStripeEvent(paidEvent, () => sql), "recorded");
	assert.equal(await recordStripeEvent(paidEvent, () => sql), "duplicate");
	assert.match(calls[0].text, /INSERT INTO stripe_webhook_events/);
	assert.match(calls[0].text, /ON CONFLICT \(id\) DO NOTHING RETURNING id/);
	assert.deepEqual(calls[0].values, [
		"evt_synthetic_paid",
		"checkout.session.completed",
		1_795_000_000,
		false,
		"cs_test_synthetic",
	]);
});

test("only ids and metadata reach the database, never customer or card data", async () => {
	const { sql, calls } = fakeLedger();
	await recordStripeEvent(paidEvent, () => sql);
	const stored = JSON.stringify(calls);
	assert.doesNotMatch(stored, /buyer@example\.com|Synthetic Buyer|card/);
});

test("a missing ledger or a failing insert keeps the event unacknowledged", async () => {
	assert.equal(await recordStripeEvent(paidEvent, () => null), "unavailable");
	const failing: SqlTag = async () => {
		throw new Error("connection refused");
	};
	assert.equal(
		await recordStripeEvent(paidEvent, () => failing),
		"unavailable",
	);
	assert.equal(
		await recordStripeEvent(paidEvent, () => {
			throw new Error("bad connection string");
		}),
		"unavailable",
	);
});

test("an unexpected object id is stored as null", async () => {
	const { sql, calls } = fakeLedger();
	const odd = {
		...paidEvent,
		id: "evt_synthetic_odd",
		data: { object: { id: 42 } },
	} as unknown as Stripe.Event;
	assert.equal(await recordStripeEvent(odd, () => sql), "recorded");
	assert.equal(calls[0].values[4], null);
});

test("schema keys the ledger by the Stripe event id and stores no personal data", async () => {
	const schema = await readFile(
		new URL("../db/stripe-webhook-events.sql", import.meta.url),
		"utf8",
	);
	assert.match(schema, /CREATE TABLE IF NOT EXISTS stripe_webhook_events/);
	assert.match(schema, /\bid text PRIMARY KEY\b/);
	for (const column of ["type", "created", "livemode", "object_id"])
		assert.match(schema, new RegExp(`\\n\\t${column} `));
	assert.doesNotMatch(schema, /\n\t(email|name|card|payload|customer)\w* /i);
});
