import { neon } from "@neondatabase/serverless";
import type Stripe from "stripe";

/** Tagged-template query function: the Neon HTTP client, or a test double. */
export type SqlTag = (
	strings: TemplateStringsArray,
	...values: unknown[]
) => Promise<unknown[]>;

type LedgerOutcome = "recorded" | "duplicate" | "unavailable";

/** The Neon Vercel Marketplace integration injects DATABASE_URL (pooled). */
function stripeLedgerSql(): SqlTag | null {
	const url = process.env.DATABASE_URL;
	return url ? neon(url) : null;
}

/**
 * Idempotent insert keyed by the Stripe event id (schema:
 * db/stripe-webhook-events.sql). A redelivered event hits the PRIMARY KEY and
 * is reported as a duplicate, so it is acknowledged without a second effect.
 * Only ids and metadata are stored: never card, customer or raw payload data.
 */
export async function recordStripeEvent(
	event: Stripe.Event,
	connect: () => SqlTag | null = stripeLedgerSql,
): Promise<LedgerOutcome> {
	const object = event.data.object as { id?: unknown };
	const objectId =
		typeof object.id === "string" && object.id.length <= 255 ? object.id : null;
	try {
		const sql = connect();
		if (!sql) return "unavailable";
		const rows =
			await sql`INSERT INTO stripe_webhook_events (id, type, created, livemode, object_id)
			VALUES (${event.id}, ${event.type}, to_timestamp(${event.created}), ${event.livemode}, ${objectId})
			ON CONFLICT (id) DO NOTHING RETURNING id`;
		return rows.length > 0 ? "recorded" : "duplicate";
	} catch {
		// Not logged: driver errors can echo the connection string. Stripe retries the 503.
		return "unavailable";
	}
}
