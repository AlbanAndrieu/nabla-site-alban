# Checkout and Support Flow Runbook

## Scope

The repository currently has two checkout implementations:

- Static HTML hosted checkout flow (`public/checkout.html` + server endpoint)
- Next.js embedded checkout flow (`app/components/checkout.tsx` + server action)

This runbook documents both so support and dev teams can quickly identify which path is active in a deployment.

## Code paths

### Static hosted checkout (legacy/public flow)

- `public/checkout.html` (form posts to `/api/create-checkout-session`)
- `public/success.html`
- `public/cancel.html`
- `public/checkout.css`
- `api/create-checkout-session.js` (Vercel serverless handler)
- `server.cjs` (local Express server with `/create-checkout-session`)

### Next.js checkout (app router flow)

- `app/components/checkout.tsx` (Stripe `EmbeddedCheckoutProvider`)
- `app/actions/stripe.ts` (`startCheckoutSession(productId)`, server action)
- `app/[locale]/checkout/page.tsx` (localized route wrapper)
- `app/[locale]/checkout/layout.tsx` (checkout-specific CSS)
- `app/api/create-checkout-session/route.ts` (Next.js API route, currently separate from server action path)

## Endpoint contracts

### `POST /api/create-checkout-session` (`api/create-checkout-session.js`)

- `Accept: application/json` -> `200 { "url": "https://checkout.stripe.com/..." }`
- non-JSON form POST -> `303` redirect to Stripe Checkout URL
- error -> `500` JSON or text depending on `Accept`

### `POST /create-checkout-session` (`server.cjs`, local only)

- Same response contract as above, but mounted on Express local server and used when running `npm run start:stripe`

### Embedded checkout session creation (`app/actions/stripe.ts`)

- Returns `session.client_secret` for Stripe embedded checkout (`ui_mode: "embedded"`)
- Uses inline `price_data` from a local catalog map (currently `default` only, USD 750 cents)
- Does not use `STRIPE_PRICE_ID`

## Environment

### Hosted checkout endpoints (`server.cjs`, `api/create-checkout-session.js`, `app/api/create-checkout-session/route.ts`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `STRIPE_SECRET_KEY` or `STRIPE_KEY` | Yes | Server-side Stripe API key |
| `STRIPE_PRICE_ID` or `PRICE_ID` | Yes | Stripe Price ID for hosted checkout |
| `DOMAIN` | Optional, recommended | Public origin for success/cancel URLs |
| `PORT` | Local only | Express listen port (`server.cjs`, default `4242`) |

### Embedded checkout UI (`app/components/checkout.tsx`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Browser Stripe key for embedded checkout |
| `STRIPE_SECRET_KEY` or `STRIPE_KEY` | Yes | Needed server-side by `app/actions/stripe.ts` |

## Local testing

### Static hosted checkout

1. Export hosted-checkout env vars
2. Run `npm run start:stripe`
3. Open `http://localhost:4242/checkout.html`
4. Use [Stripe test cards](https://docs.stripe.com/testing)

`npm run start:python` (or any static-only server) does not provide `/create-checkout-session`, so checkout submission fails unless an API endpoint is separately running.

### Next.js localized checkout route

1. Export `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and Stripe secret key
2. Run `npm run dev`
3. Open `/checkout` and `/fr/checkout`
4. Confirm embedded checkout mounts (or explicit missing-key alert appears)

## Redirect URLs and support references

Hosted endpoints currently set:

- success: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}` (or `/success` in `app/api/create-checkout-session/route.ts`)
- cancel: `${origin}/cancel.html` (or `/cancel` in `app/api/create-checkout-session/route.ts`)

`public/success.html` displays `session_id` for support reference only. It does not verify payment status server-side.

To verify payment state, add an authenticated backend check with `stripe.checkout.sessions.retrieve(session_id)` and validate `payment_status`.

## Current operational pitfalls

- `public/create-checkout-session.js` contains server-side Express code instead of browser fetch logic; treat it as stale/non-runtime until corrected.
- `vercel.json` currently routes `/api/(.*)` to `api/$1.js`, while `public/checkout.html` posts to `/api/create-checkout-session`; keep those aligned when changing endpoint paths.
- There are two server checkout endpoints (`api/create-checkout-session.js` and `app/api/create-checkout-session/route.ts`) with different origin rules and redirect targets; choose one canonical path before extending checkout behavior.

## Troubleshooting

- `500 Missing STRIPE_PRICE_ID`: set a valid Stripe Price ID for hosted checkout endpoints.
- `500 Missing STRIPE_SECRET_KEY`: missing secret key in runtime environment.
- `500 No such price`: test/live key mismatch with the configured price.
- Embedded checkout shows unavailable message: set `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- Redirect path mismatch (`/success` vs `/success.html`): verify which server endpoint handled the request and align links/pages accordingly.
