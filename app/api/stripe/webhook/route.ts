import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_EVENT_BYTES = 65536;
const PAYMENT_EVENTS = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
]);

/**
 * Authentication boundary only. Payment fulfillment must be durable, idempotent
 * and transactional before acknowledging payment events.
 *
 * Stripe retries 503 responses. Never return 2xx for paid events until a
 * persistent event ledger and business handler have been configured.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !secret.startsWith("whsec_")) {
    return NextResponse.json({ error: "Webhook unavailable" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (!Number.isFinite(declaredLength) || declaredLength > MAX_EVENT_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }
  const payload = await request.text();
  if (Buffer.byteLength(payload, "utf8") > MAX_EVENT_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const stripe = getStripeClient();
  if (!stripe) return NextResponse.json({ error: "Webhook unavailable" }, { status: 503 });

  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (PAYMENT_EVENTS.has(event.type)) {
    // Do not acknowledge until durable, idempotent fulfillment is implemented.
    // No customer data, signatures, raw events or keys are logged.
    return NextResponse.json({ error: "Fulfillment not configured" }, { status: 503 });
  }
  return NextResponse.json({ received: true });
}
