import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import PaymentShell from "@/components/payments/PaymentShell";
import { routing } from "@/i18n/routing";
import { DIRECT_STRIPE_PAYMENT_LINK, paymentLocale } from "@/lib/paymentPages";

type Props = { params: Promise<{ locale: string }> };

export const metadata: Metadata = {
	title: "Checkout canceled | Alban Andrieu",
	robots: { index: false, follow: false },
};

export default async function CancelPage({ params }: Props) {
	const { locale: rawLocale } = await params;
	if (!hasLocale(routing.locales, rawLocale)) notFound();
	const locale = paymentLocale(rawLocale);
	setRequestLocale(locale);
	const fr = locale === "fr";

	return (
		<PaymentShell locale={locale}>
			<main id="main-content" className="checkout-page">
				<section className="checkout-card checkout-result">
					<div className="result-icon result-cancel" aria-hidden="true">
						<i className="fa-solid fa-circle-xmark" />
					</div>
					<h1 className="checkout-title">
						{fr ? "Paiement annulé" : "Checkout canceled"}
					</h1>
					<p className="checkout-message">
						{fr
							? "Aucun paiement n’a été effectué. Vous pouvez réessayer à tout moment."
							: "No payment was made. You can try again at any time."}
					</p>
					<p className="checkout-message">
						{fr ? "Vous pouvez aussi utiliser le " : "You can also use the "}
						<a href={DIRECT_STRIPE_PAYMENT_LINK} rel="noopener noreferrer">
							{fr ? "lien Stripe direct" : "direct Stripe link"}
						</a>
						{fr ? " ou payer par " : " or pay by "}
						<a href={`/${locale}/payment#pay-sepa`}>
							{fr ? "virement SEPA" : "SEPA transfer"}
						</a>
						.
					</p>
					<p className="checkout-actions">
						<a href={`/${locale}/payment`} className="checkout-button">
							{fr
								? "Retour aux options de paiement"
								: "Back to payment options"}
						</a>
						<a
							href={`/${locale}`}
							className="checkout-button checkout-button-secondary"
						>
							{fr ? "Retour au site" : "Back to site"}
						</a>
					</p>
				</section>
			</main>
		</PaymentShell>
	);
}
