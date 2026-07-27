import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import PaymentShell from "@/components/payments/PaymentShell";
import { routing } from "@/i18n/routing";
import { paymentLocale } from "@/lib/paymentPages";
import { getStripeClient } from "@/lib/stripe";

type Props = {
	params: Promise<{ locale: string }>;
	searchParams: Promise<{ session_id?: string | string[] }>;
};

export const metadata: Metadata = {
	title: "Payment status | Alban Andrieu",
	robots: { index: false, follow: false },
};

async function paymentIsConfirmed(
	sessionId: string | undefined,
): Promise<boolean> {
	if (!sessionId || !/^cs_(test_|live_)?[A-Za-z0-9]+$/.test(sessionId))
		return false;
	const stripe = getStripeClient();
	if (!stripe) return false;
	try {
		const session = await stripe.checkout.sessions.retrieve(sessionId);
		return session.status === "complete" && session.payment_status === "paid";
	} catch (error) {
		console.error("checkout-session-retrieve:", error);
		return false;
	}
}

export default async function SuccessPage({ params, searchParams }: Props) {
	const { locale: rawLocale } = await params;
	if (!hasLocale(routing.locales, rawLocale)) notFound();
	const locale = paymentLocale(rawLocale);
	setRequestLocale(locale);
	const rawSessionId = (await searchParams).session_id;
	const sessionId = Array.isArray(rawSessionId)
		? rawSessionId[0]
		: rawSessionId;
	const confirmed = await paymentIsConfirmed(sessionId);
	const fr = locale === "fr";

	return (
		<PaymentShell locale={locale}>
			<main id="main-content" className="checkout-page">
				<section className="checkout-card checkout-result">
					<div
						className={`result-icon ${confirmed ? "result-success" : "result-cancel"}`}
						aria-hidden="true"
					>
						<i
							className={`fa-solid ${confirmed ? "fa-circle-check" : "fa-circle-info"}`}
						/>
					</div>
					<h1 className="checkout-title">
						{confirmed
							? fr
								? "Merci pour votre paiement"
								: "Thank you for your payment"
							: fr
								? "Paiement en cours de vérification"
								: "Payment verification pending"}
					</h1>
					<p className="checkout-message">
						{confirmed
							? fr
								? "Le paiement a bien été confirmé par Stripe."
								: "Stripe has confirmed your payment."
							: fr
								? "Nous ne pouvons pas encore confirmer ce paiement. Vérifiez le lien reçu de Stripe ou contactez-nous."
								: "We cannot confirm this payment yet. Check the link received from Stripe or contact us."}
					</p>
					<p className="checkout-message">
						{fr ? "Pour toute question : " : "Questions? Contact "}
						<a href="mailto:invoice@albandrieu.com">invoice@albandrieu.com</a>.
					</p>
					<p className="checkout-actions">
						<a
							href={`/${locale}/payment`}
							className="checkout-button checkout-button-secondary"
						>
							{fr ? "Options de paiement" : "Payment options"}
						</a>
						<a href={`/${locale}`} className="checkout-button">
							{fr ? "Retour au site" : "Back to site"}
						</a>
					</p>
				</section>
			</main>
		</PaymentShell>
	);
}
