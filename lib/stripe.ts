import Stripe from "stripe";

export function getStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_KEY;
  return key ? new Stripe(key) : null;
}
