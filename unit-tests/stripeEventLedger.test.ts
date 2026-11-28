import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { afterEach, test } from "node:test";
import type Stripe from "stripe";
import {
	type LedgerInsert,
	type LedgerRow,
	recordStripeEvent,
} from "../lib/stripeEventLedger";

/** In-memory stand-in for the PRIMARY KEY of stripe_webhook_events. */
function fakeLedger() {
	const ids = new Set<string>();
	const rows: LedgerRow[] = [];
	const insert: LedgerInsert = async (row) => {
		rows.push(row);
		if (ids.has(row.id)) return [];
		ids.add(row.id);
		return [row];
	};
	return { insert, rows };
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
	const { insert, rows } = fakeLedger();
	assert.equal(await recordStripeEvent(paidEvent, () => insert), "recorded");
	assert.equal(await recordStripeEvent(paidEvent, () => insert), "duplicate");
	assert.deepEqual(rows[0], {
		id: "evt_synthetic_paid",
		type: "checkout.session.completed",
		created: new Date(1_795_000_000_000).toISOString(),
		livemode: false,
		object_id: "cs_test_synthetic",
	});
});

test("only ids and metadata reach the database, never customer or card data", async () => {
	const { insert, rows } = fakeLedger();
	await recordStripeEvent(paidEvent, () => insert);
	assert.doesNotMatch(
		JSON.stringify(rows),
		/buyer@example\.com|Synthetic Buyer|card/,
	);
});

test("a missing ledger or a failing insert keeps the event unacknowledged", async () => {
	assert.equal(await recordStripeEvent(paidEvent, () => null), "unavailable");
	const failing: LedgerInsert = async () => {
		throw new Error("connection refused");
	};
	assert.equal(
		await recordStripeEvent(paidEvent, () => failing),
		"unavailable",
	);
	assert.equal(
		await recordStripeEvent(paidEvent, () => {
			throw new Error("bad configuration");
		}),
		"unavailable",
	);
});

test("an unexpected object id is stored as null", async () => {
	const { insert, rows } = fakeLedger();
	const odd = {
		...paidEvent,
		id: "evt_synthetic_odd",
		data: { object: { id: 42 } },
	} as unknown as Stripe.Event;
	assert.equal(await recordStripeEvent(odd, () => insert), "recorded");
	assert.equal(rows[0].object_id, null);
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
	assert.match(schema, /ENABLE ROW LEVEL SECURITY/);
	assert.match(
		schema,
		/REVOKE ALL ON stripe_webhook_events FROM anon, authenticated/,
	);
});

const LEDGER_ENV = [
	"SUPABASE_URL",
	"SUPABASE_SECRET_KEY",
	"SUPABASE_SERVICE_ROLE_KEY",
] as const;
const savedEnv = Object.fromEntries(LEDGER_ENV.map((k) => [k, process.env[k]]));
const savedFetch = globalThis.fetch;
afterEach(() => {
	globalThis.fetch = savedFetch;
	for (const key of LEDGER_ENV) {
		if (savedEnv[key] === undefined) delete process.env[key];
		else process.env[key] = savedEnv[key];
	}
});

function stubSupabase(body: unknown, status = 201) {
	const calls: { url: string; init: RequestInit }[] = [];
	globalThis.fetch = (async (
		input: RequestInfo | URL,
		init: RequestInit = {},
	) => {
		calls.push({ url: String(input), init });
		return Response.json(body, { status });
	}) as typeof fetch;
	return calls;
}

test("Supabase REST insert ignores duplicates and keeps the key server-side", async () => {
	for (const key of LEDGER_ENV) delete process.env[key];
	assert.equal(await recordStripeEvent(paidEvent), "unavailable");

	process.env.SUPABASE_URL = "https://fixture.supabase.co/";
	process.env.SUPABASE_SERVICE_ROLE_KEY = "fixture-service-role-jwt";
	let calls = stubSupabase([{ id: "evt_synthetic_paid" }]);
	assert.equal(await recordStripeEvent(paidEvent), "recorded");
	assert.equal(
		calls[0].url,
		"https://fixture.supabase.co/rest/v1/stripe_webhook_events?on_conflict=id",
	);
	const headers = calls[0].init.headers as Record<string, string>;
	assert.equal(headers.apikey, "fixture-service-role-jwt");
	assert.equal(headers.Authorization, "Bearer fixture-service-role-jwt");
	assert.equal(
		headers.Prefer,
		"resolution=ignore-duplicates,return=representation",
	);

	calls = stubSupabase([]);
	assert.equal(await recordStripeEvent(paidEvent), "duplicate");

	process.env.SUPABASE_SECRET_KEY = "sb_secret_fixture";
	calls = stubSupabase([]);
	await recordStripeEvent(paidEvent);
	const secretHeaders = calls[0].init.headers as Record<string, string>;
	assert.equal(secretHeaders.apikey, "sb_secret_fixture");
	assert.equal(secretHeaders.Authorization, undefined);

	stubSupabase({ message: "permission denied" }, 401);
	assert.equal(await recordStripeEvent(paidEvent), "unavailable");
});
