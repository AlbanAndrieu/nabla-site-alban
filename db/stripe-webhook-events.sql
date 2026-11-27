-- A5: ledger of Stripe webhook payment events (Supabase Postgres, Vercel Marketplace).
-- The PRIMARY KEY on the Stripe event id makes redeliveries idempotent and keeps
-- an audit trail. Only ids and metadata: never card, customer or raw payload data.
-- Apply once, before registering the webhook (see docs/stripe-hardening-roadmap.md).
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
	id text PRIMARY KEY,
	type text NOT NULL,
	created timestamptz NOT NULL,
	livemode boolean NOT NULL,
	-- Checkout Session id (cs_...), enough to retrieve the session at fulfilment time.
	object_id text,
	received_at timestamptz NOT NULL DEFAULT now()
);

-- Supabase exposes the public schema over REST: RLS on with no policy, and no
-- grant to the client roles, so only the server-side secret key can write.
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON stripe_webhook_events FROM anon, authenticated;
