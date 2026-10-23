export type PaymentLocale = "en" | "fr";

export function paymentLocale(locale: string): PaymentLocale {
	return locale === "fr" ? "fr" : "en";
}

export const DIRECT_STRIPE_PAYMENT_LINK =
	"https://buy.stripe.com/9B65kF1Gd8hHcr2d69cV200";
