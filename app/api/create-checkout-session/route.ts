import { type NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";

export const runtime = "nodejs";

/** Parse env DOMAIN into a safe origin (scheme + host only). Never use request Host headers — open redirect risk. */
export function originFromDomainEnv(raw: string): string | null {
	const trimmed = raw.replace(/\/$/, "").trim();
	if (!trimmed) return null;
	try {
		const u = new URL(trimmed);
		if (u.protocol !== "http:" && u.protocol !== "https:") return null;
		if (u.username || u.password) return null;
		return `${u.protocol}//${u.host}`;
	} catch {
		return null;
	}
}

/**
 * Trusted origin for Stripe success/cancel URLs only from server-controlled config:
 * DOMAIN (allowlisted format), or VERCEL_URL (set by Vercel), or localhost in non-production.
 */
export function getTrustedOrigin():
	| { ok: true; origin: string }
	| { ok: false; error: string } {
	const domainRaw = (process.env.DOMAIN || "").trim();
	if (domainRaw) {
		const origin = originFromDomainEnv(domainRaw);
		if (!origin) {
			return {
				ok: false,
				error:
					"Invalid DOMAIN: use a full http(s) origin with no trailing slash, path, or credentials (e.g. https://www.albandrieu.com).",
			};
		}
		return { ok: true, origin };
	}

	const vercel = process.env.VERCEL_URL?.replace(/\/$/, "").trim();
	if (vercel) {
		const host = vercel.replace(/^https?:\/\//i, "");
		if (host) return { ok: true, origin: `https://${host}` };
	}

	if (process.env.NODE_ENV !== "production") {
		return { ok: true, origin: "http://localhost:3000" };
	}

	return {
		ok: false,
		error:
			"Set DOMAIN to your public https origin (no trailing slash), or deploy on Vercel so VERCEL_URL is available.",
	};
}

export function wantsJson(req: NextRequest): boolean {
	const accept = req.headers.get("accept") || "";
	return accept.includes("application/json");
}

export function checkoutLocale(value: unknown): "en" | "fr" {
	return value === "fr" ? "fr" : "en";
}

export function checkoutReturnUrls(origin: string, locale: "en" | "fr") {
	return {
		successUrl: `${origin}/${locale}/success?session_id={CHECKOUT_SESSION_ID}`,
		cancelUrl: `${origin}/${locale}/cancel`,
	};
}

export async function POST(req: NextRequest) {
	const priceId = process.env.STRIPE_PRICE_ID || process.env.PRICE_ID || "";
	const stripe = getStripeClient();

	if (!stripe) {
		const msg =
			"Missing STRIPE_SECRET_KEY. Set it in the Vercel project environment.";
		return wantsJson(req)
			? NextResponse.json({ error: msg }, { status: 500 })
			: new NextResponse(msg, { status: 500 });
	}
	if (!priceId) {
		const msg =
			"Missing STRIPE_PRICE_ID. Create a Price in Stripe and set STRIPE_PRICE_ID.";
		return wantsJson(req)
			? NextResponse.json({ error: msg }, { status: 500 })
			: new NextResponse(msg, { status: 500 });
	}

	const trusted = getTrustedOrigin();
	if (!trusted.ok) {
		return wantsJson(req)
			? NextResponse.json({ error: trusted.error }, { status: 500 })
			: new NextResponse(trusted.error, { status: 500 });
	}
	const origin = trusted.origin;

	let locale: "en" | "fr" = "en";
	try {
		if (req.headers.get("content-type")?.includes("application/json")) {
			const body = (await req.json()) as { locale?: unknown };
			locale = checkoutLocale(body.locale);
		} else {
			const form = await req.formData();
			locale = checkoutLocale(form.get("locale"));
		}
	} catch {
		// Keep the default locale for empty or malformed bodies.
	}
	const returnUrls = checkoutReturnUrls(origin, locale);

	try {
		const session = await stripe.checkout.sessions.create({
			line_items: [{ price: priceId, quantity: 1 }],
			mode: "payment",
			success_url: returnUrls.successUrl,
			cancel_url: returnUrls.cancelUrl,
			metadata: { locale },
		});

		if (!session.url) {
			const msg = "Checkout session missing redirect URL.";
			return wantsJson(req)
				? NextResponse.json({ error: msg }, { status: 500 })
				: new NextResponse(msg, { status: 500 });
		}

		if (wantsJson(req)) {
			return NextResponse.json({ url: session.url });
		}
		return NextResponse.redirect(session.url, 303);
	} catch (err: unknown) {
		console.error("create-checkout-session:", err);
		const message = "Could not create checkout session. Please try again.";
		return wantsJson(req)
			? NextResponse.json({ error: message }, { status: 500 })
			: new NextResponse(message, { status: 500 });
	}
}
