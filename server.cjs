/**
 * Stripe Checkout server (CommonJS: node server.cjs).
 * Env: STRIPE_SECRET_KEY (or STRIPE_KEY), STRIPE_PRICE_ID (or PRICE_ID),
 *      DOMAIN (origin only, e.g. http://localhost:4242 — no trailing slash)
 *
 * Pattern matches Stripe’s hosted Checkout sample: create session → redirect to session.url.
 * POST with Accept: application/json returns { url } for fetch-based clients; otherwise 303 redirect.
 */
const path = require("node:path");
const express = require("express");
const stripeSecret = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_KEY;
const stripe = stripeSecret ? require("stripe")(stripeSecret) : null;
if (!stripeSecret) {
	console.warn(
		"STRIPE_SECRET_KEY is not set — configure it before using /create-checkout-session.",
	);
}

const app = express();
const DOMAIN = (process.env.DOMAIN || "http://localhost:4242").replace(
	/\/$/,
	"",
);
const PRICE_ID = process.env.STRIPE_PRICE_ID || process.env.PRICE_ID;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

function wantsJsonResponse(req) {
	const accept = req.get("accept") || "";
	return accept.includes("application/json");
}

app.post("/create-checkout-session", async (req, res) => {
	if (!stripe || !stripeSecret) {
		const msg = "Missing STRIPE_SECRET_KEY. Set it in the environment.";
		return wantsJsonResponse(req)
			? res.status(500).json({ error: msg })
			: res.status(500).send(msg);
	}
	if (!PRICE_ID) {
		const msg =
			"Missing STRIPE_PRICE_ID. Create a Price in the Stripe Dashboard and set STRIPE_PRICE_ID.";
		return wantsJsonResponse(req)
			? res.status(500).json({ error: msg })
			: res.status(500).send(msg);
	}

	try {
		const session = await stripe.checkout.sessions.create({
			line_items: [
				{
					price: PRICE_ID,
					quantity: 1,
				},
			],
			mode: "payment",
			/* Stripe replaces {CHECKOUT_SESSION_ID} when the customer returns */
			success_url: `${DOMAIN}/success.html?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${DOMAIN}/cancel.html`,
		});

		if (wantsJsonResponse(req)) {
			return res.json({ url: session.url });
		}
		return res.redirect(303, session.url);
	} catch (err) {
		console.error(err);
		const message = err.message || "Checkout session failed.";
		return wantsJsonResponse(req)
			? res.status(500).json({ error: message })
			: res.status(500).send(message);
	}
});

const port = process.env.PORT || 4242;
app.listen(port, () => {
	console.log(`Stripe checkout server on port ${port}`);
	console.log(
		`DOMAIN=${DOMAIN} PRICE_ID=${PRICE_ID ? "set" : "MISSING"} STRIPE_SECRET_KEY=${stripeSecret ? "set" : "MISSING"}`,
	);
});
