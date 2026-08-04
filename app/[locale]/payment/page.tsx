import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import PaymentShell from "@/components/payments/PaymentShell";
import { routing } from "@/i18n/routing";
import { DIRECT_STRIPE_PAYMENT_LINK, paymentLocale } from "@/lib/paymentPages";
import { NON_INDEXABLE_ROBOTS } from "@/lib/sitePageCatalog";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const locale = paymentLocale((await params).locale);
	const t = await getTranslations({ locale, namespace: "checkout" });
	return {
		title: t("meta.paymentTitle"),
		robots: NON_INDEXABLE_ROBOTS,
	};
}

export default async function PaymentPage({ params }: Props) {
	const { locale: rawLocale } = await params;
	if (!hasLocale(routing.locales, rawLocale)) notFound();
	const locale = paymentLocale(rawLocale);
	setRequestLocale(locale);
	const t = await getTranslations("checkout");

	return (
		<PaymentShell locale={locale}>
			<main id="main-content" className="checkout-page payment-options">
				<header className="payment-options-intro">
					<h1>{t("options.title")}</h1>
					<p>{t("options.intro")}</p>
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
								{t("options.cardTitle")}
							</h2>
							<p className="checkout-subtitle">
								{t("options.cardDescription")}
							</p>
						</div>
					</div>
					<p className="mb-0 mt-3">
						<a
							href={`/${locale}/checkout`}
							className="checkout-button w-100 text-center"
						>
							<i className="fa-solid fa-lock" aria-hidden="true" />{" "}
							{t("options.continue")}
						</a>
					</p>
					<p className="checkout-footer small mb-0">
						{t("options.issueBeforeLink")}
						<a href={DIRECT_STRIPE_PAYMENT_LINK} rel="noopener noreferrer">
							{t("options.directLink")}
						</a>
						{t("options.issueAfterLink")}
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
								{t("options.bankTitle")}
							</h2>
							<p className="checkout-subtitle">
								{t("options.bankDescription")}
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
							{t("options.downloadBankDetails")}
						</a>
					</p>
					<p className="checkout-footer small mb-0">
						{t("options.afterPayment")}
						<a href="mailto:job@albandrieu.com">job@albandrieu.com</a>.
					</p>
				</section>
			</main>
		</PaymentShell>
	);
}
