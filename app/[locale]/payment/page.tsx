import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import PaymentShell from "@/components/payments/PaymentShell";
import { routing } from "@/i18n/routing";
import { DIRECT_STRIPE_PAYMENT_LINK, paymentLocale } from "@/lib/paymentPages";
import { NON_INDEXABLE_ROBOTS } from "@/lib/sitePageCatalog";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const locale = paymentLocale((await params).locale);
	return {
		title:
			locale === "fr"
				? "Options de paiement — Alban Andrieu"
				: "Payment options — Alban Andrieu",
		robots: NON_INDEXABLE_ROBOTS,
	};
}

export default async function PaymentPage({ params }: Props) {
	const { locale: rawLocale } = await params;
	if (!hasLocale(routing.locales, rawLocale)) notFound();
	const locale = paymentLocale(rawLocale);
	setRequestLocale(locale);
	const fr = locale === "fr";

	return (
		<PaymentShell locale={locale}>
			<main id="main-content" className="checkout-page payment-options">
				<header className="payment-options-intro">
					<h1>{fr ? "Options de paiement" : "Payment options"}</h1>
					<p>
						{fr
							? "Payez par carte avec la page de paiement hébergée par Stripe, ou par virement SEPA avec le RIB ci-dessous."
							: "Pay by card with Stripe-hosted Checkout, or by SEPA bank transfer using the bank details below."}
					</p>
				</header>
				<section className="checkout-card" aria-labelledby="pay-stripe-heading">
					<div className="product">
						<Image
							src="/assets/nabla/nabla-4.svg"
							alt=""
							width={64}
							height={64}
						/>
						<div className="description">
							<h2 id="pay-stripe-heading" className="checkout-title">
								{fr ? "Payer par carte (Stripe)" : "Pay by card (Stripe)"}
							</h2>
							<p className="checkout-subtitle">
								{fr
									? "Paiement unique sécurisé sur le site de Stripe."
									: "Secure one-time payment on Stripe’s hosted checkout."}
							</p>
						</div>
					</div>
					<p className="mb-0 mt-3">
						<a
							href={`/${locale}/checkout`}
							className="checkout-button w-100 text-center"
						>
							<i className="fa-solid fa-lock" aria-hidden="true" />{" "}
							{fr ? "Continuer vers Stripe" : "Continue to Stripe Checkout"}
						</a>
					</p>
					<p className="checkout-footer small mb-0">
						{fr
							? "En cas de problème, utilisez le "
							: "If checkout does not start, use the "}
						<a href={DIRECT_STRIPE_PAYMENT_LINK} rel="noopener noreferrer">
							{fr ? "lien Stripe direct" : "direct Stripe link"}
						</a>
						{fr
							? ", le virement SEPA ou contactez-moi."
							: ", a SEPA transfer, or contact me."}
					</p>
				</section>
				<section
					id="pay-sepa"
					className="checkout-card"
					aria-labelledby="pay-bank-heading"
				>
					<div className="product">
						<i
							className="fa-solid fa-building-columns fa-3x text-primary"
							aria-hidden="true"
						/>
						<div className="description">
							<h2 id="pay-bank-heading" className="checkout-title">
								{fr
									? "Payer par virement bancaire (SEPA)"
									: "Pay by bank transfer (SEPA)"}
							</h2>
							<p className="checkout-subtitle">
								{fr
									? "Indiquez la facture ou la référence dans le libellé du virement."
									: "Include the invoice or reference in the transfer label."}
							</p>
						</div>
					</div>
					<p className="mb-0 mt-3">
						<a
							href="/assets/rib-alban-andrieu-boursorama.pdf"
							className="checkout-button checkout-button-secondary w-100 text-center"
							download
						>
							<i className="fa-solid fa-file-pdf" aria-hidden="true" />{" "}
							{fr ? "Télécharger le RIB (PDF)" : "Download bank details (PDF)"}
						</a>
					</p>
					<p className="checkout-footer small mb-0">
						{fr
							? "Après le paiement, envoyez si nécessaire la référence à "
							: "After paying, send the transfer reference if needed to "}
						<a href="mailto:job@albandrieu.com">job@albandrieu.com</a>.
					</p>
				</section>
			</main>
		</PaymentShell>
	);
}
