/**
 * Vercel Node serverless: POST /create-checkout-session (via vercel.json rewrite to /api/...).
 * Browser client: public/create-checkout-session.js (must stay separate — never put this handler in public/).
 * Env: STRIPE_SECRET_KEY (or STRIPE_KEY), STRIPE_PRICE_ID (or PRICE_ID).
 * Optional DOMAIN — full origin, no trailing slash (defaults to request Host + X-Forwarded-Proto).
 */
import Stripe from "stripe";

function getOrigin(req) {
	const configured = (process.env.DOMAIN || "").replace(/\/$/, "");
	if (configured) return configured;
	const proto =
		(req.headers["x-forwarded-proto"] || "https").split(",")[0].trim() ||
		"https";
	const host = (req.headers["x-forwarded-host"] || req.headers.host || "")
		.split(",")[0]
		.trim();
	if (!host) return "https://www.dr-alban.com";
	return `${proto}://${host}`;
}

async function readJsonBody(req) {
	if (
		req.body != null &&
		typeof req.body === "object" &&
		!Buffer.isBuffer(req.body)
	) {
		return req.body;
	}
	const chunks = [];
	for await (const chunk of req) {
		chunks.push(chunk);
	}
	const raw = Buffer.concat(chunks).toString("utf8");
	if (!raw) return {};
	try {
		return JSON.parse(raw);
	} catch {
		return {};
	}
}

function wantsJson(req) {
	const accept = req.headers.accept || "";
	return accept.includes("application/json");
}

export default async function handler(req, res) {
	if (req.method !== "POST") {
		res.setHeader("Allow", "POST");
		if (wantsJson(req)) {
			return res.status(405).json({ error: "Method not allowed" });
		}
		return res.status(405).send("Method not allowed");
	}

	const stripeSecret =
		process.env.STRIPE_SECRET_KEY || process.env.STRIPE_KEY || "";
	const priceId = process.env.STRIPE_PRICE_ID || process.env.PRICE_ID || "";

	if (!stripeSecret) {
		const msg =
			"Missing STRIPE_SECRET_KEY. Set it in the Vercel project environment.";
		return wantsJson(req)
			? res.status(500).json({ error: msg })
			: res.status(500).send(msg);
	}
	if (!priceId) {
		const msg =
			"Missing STRIPE_PRICE_ID. Create a Price in Stripe and set STRIPE_PRICE_ID.";
		return wantsJson(req)
			? res.status(500).json({ error: msg })
			: res.status(500).send(msg);
	}

	await readJsonBody(req);

	const origin = getOrigin(req);
	const stripe = new Stripe(stripeSecret);

	try {
		const session = await stripe.checkout.sessions.create({
			line_items: [{ price: priceId, quantity: 1 }],
			mode: "payment",
			success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${origin}/cancel.html`,
		});

		if (wantsJson(req)) {
			return res.status(200).json({ url: session.url });
		}
		res.setHeader("Location", session.url);
		return res.status(303).end();
	} catch (err) {
		console.error("create-checkout-session:", err);
		const message = err.message || "Checkout session failed.";
		return wantsJson(req)
			? res.status(500).json({ error: message })
			: res.status(500).send(message);
	}
}
