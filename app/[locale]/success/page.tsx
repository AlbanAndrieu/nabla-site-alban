import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import PaymentShell from "@/components/payments/PaymentShell";
import { routing } from "@/i18n/routing";
import { paymentLocale } from "@/lib/paymentPages";
import { NON_INDEXABLE_ROBOTS } from "@/lib/sitePageCatalog";
import { getStripeClient } from "@/lib/stripe";

type Props = {
	params: Promise<{ locale: string }>;
	searchParams: Promise<{ session_id?: string | string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const locale = paymentLocale((await params).locale);
	const t = await getTranslations({ locale, namespace: "checkout" });
	return { title: t("meta.successTitle"), robots: NON_INDEXABLE_ROBOTS };
}

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
	const t = await getTranslations("checkout");
	const rawSessionId = (await searchParams).session_id;
	const sessionId = Array.isArray(rawSessionId)
		? rawSessionId[0]
		: rawSessionId;
	const confirmed = await paymentIsConfirmed(sessionId);

	return (
		<PaymentShell>
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
							? t("success.confirmedTitle")
							: t("success.pendingTitle")}
					</h1>
					<p className="checkout-message">
						{confirmed
							? t("success.confirmedMessage")
							: t("success.pendingMessage")}
					</p>
					<p className="checkout-message">
						{t("success.questions")}
						<a href="mailto:invoice@albandrieu.com">invoice@albandrieu.com</a>.
					</p>
					<p className="checkout-actions">
						<a
							href={`/${locale}/payment`}
							className="checkout-button checkout-button-secondary"
						>
							{t("success.paymentOptions")}
						</a>
						<a href={`/${locale}`} className="checkout-button">
							{t("success.backSite")}
						</a>
					</p>
				</section>
			</main>
		</PaymentShell>
	);
}
