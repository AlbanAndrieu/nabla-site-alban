import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import PaymentShell from "@/components/payments/PaymentShell";
import { routing } from "@/i18n/routing";
import { paymentCopy, paymentLocale } from "@/lib/paymentPages";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale: rawLocale } = await params;
	const locale = paymentLocale(rawLocale);
	return {
		title:
			locale === "fr"
				? "Paiement sécurisé | Alban Andrieu"
				: "Secure checkout | Alban Andrieu",
		description: paymentCopy[locale].checkoutSubtitle,
		robots: { index: false, follow: false },
	};
}

export default async function CheckoutPage({ params }: Props) {
	const { locale: rawLocale } = await params;
	if (!hasLocale(routing.locales, rawLocale)) notFound();
	const locale = paymentLocale(rawLocale);
	setRequestLocale(locale);
	const copy = paymentCopy[locale];

	return (
		<PaymentShell locale={locale}>
			<main id="main-content" className="checkout-page">
				<section className="checkout-card">
					<div className="product">
						<Image
							src="/assets/nabla/nabla-4.svg"
							alt="Nabla"
							width={64}
							height={64}
						/>
						<div className="description">
							<h1 className="checkout-title">{copy.checkoutTitle}</h1>
							<p className="checkout-subtitle">{copy.checkoutSubtitle}</p>
						</div>
					</div>
					<figure className="checkout-qr">
						<Image
							src="/assets/stripe/tjm-stripe.png"
							alt={copy.qrAlt}
							width={440}
							height={528}
						/>
						<figcaption className="checkout-qr-caption">
							{copy.qrCaption}
						</figcaption>
					</figure>
					<form
						action="/api/create-checkout-session"
						method="POST"
						className="checkout-form"
					>
						<input type="hidden" name="locale" value={locale} />
						<button
							type="submit"
							id="checkout-button"
							className="checkout-button"
						>
							<i className="fa-solid fa-lock" aria-hidden="true" />{" "}
							{copy.checkoutButton}
						</button>
					</form>
					<p className="checkout-footer">
						<a href={`/${locale}`}>{copy.back}</a>
					</p>
				</section>
			</main>
		</PaymentShell>
	);
}
