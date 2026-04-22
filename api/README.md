# Vercel serverless API (`api/`)

Node.js handlers for [Vercel serverless functions](https://vercel.com/docs/functions). Routes are defined in root `vercel.json` (for example `/api/*` → `api/*.js`).

Includes Stripe Checkout (`create-checkout-session.js`) and other small endpoints. Install dependencies from the repository root (`npm install`); Vercel bundles `api/` for deployment.
