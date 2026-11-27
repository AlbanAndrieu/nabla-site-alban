import type Stripe from "stripe";

/** One ledger row: ids and metadata only, never card, customer or payload data. */
export type LedgerRow = {
	id: string;
	type: string;
	created: string;
	livemode: boolean;
	object_id: string | null;
};

/** Inserts a row and returns the inserted rows (empty for a duplicate). */
export type LedgerInsert = (row: LedgerRow) => Promise<unknown[]>;

type LedgerOutcome = "recorded" | "duplicate" | "unavailable";

/**
 * The Supabase Vercel Marketplace integration injects SUPABASE_URL and a
 * server-only key. The table has RLS on and no policy: only this key writes.
 */
function supabaseLedgerInsert(): LedgerInsert | null {
	const url = process.env.SUPABASE_URL;
	const key =
		process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!url || !key) return null;
	// New sb_secret_ keys are not JWTs: they go in `apikey` only.
	const headers: Record<string, string> = {
		apikey: key,
		"Content-Type": "application/json",
		Prefer: "resolution=ignore-duplicates,return=representation",
		...(key.startsWith("sb_secret_") ? {} : { Authorization: `Bearer ${key}` }),
	};
	return async (row) => {
		const response = await fetch(
			`${url.replace(/\/+$/, "")}/rest/v1/stripe_webhook_events?on_conflict=id`,
			{
				method: "POST",
				headers,
				body: JSON.stringify(row),
				cache: "no-store",
				signal: AbortSignal.timeout(5000),
			},
		);
		if (!response.ok) throw new Error(`ledger HTTP ${response.status}`);
		const rows: unknown = await response.json();
		if (!Array.isArray(rows)) throw new Error("ledger: unexpected body");
		return rows;
	};
}

/**
 * Idempotent insert keyed by the Stripe event id (schema:
 * db/stripe-webhook-events.sql). A redelivered event hits the PRIMARY KEY,
 * is ignored by PostgREST and reported as a duplicate, so it is acknowledged
 * without a second effect.
 */
export async function recordStripeEvent(
	event: Stripe.Event,
	connect: () => LedgerInsert | null = supabaseLedgerInsert,
): Promise<LedgerOutcome> {
	const object = event.data.object as { id?: unknown };
	const objectId =
		typeof object.id === "string" && object.id.length <= 255 ? object.id : null;
	try {
		const insert = connect();
		if (!insert) return "unavailable";
		const rows = await insert({
			id: event.id,
			type: event.type,
			created: new Date(event.created * 1000).toISOString(),
			livemode: event.livemode,
			object_id: objectId,
		});
		return rows.length > 0 ? "recorded" : "duplicate";
	} catch {
		// Not logged: errors could echo the project URL or key. Stripe retries the 503.
		return "unavailable";
	}
}
