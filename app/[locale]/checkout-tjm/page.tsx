import type { Metadata } from "next";
import Image from "next/image";
import Script from "next/script";
import { getTranslations, setRequestLocale } from "next-intl/server";
import TopAnchor from "@/components/TopAnchor";
import { NON_INDEXABLE_ROBOTS } from "@/lib/sitePageCatalog";

export const metadata: Metadata = {
	robots: NON_INDEXABLE_ROBOTS,
};

export default async function CheckoutTjmPage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations("checkoutTjm");
	const site = await getTranslations("site");
	return (
		<div className="site-content-page">
			<TopAnchor />
			<a href="#main-content" className="skip-to-main">
				{site("skipToMainContent")}
			</a>
			<main id="main-content" className="checkout-page">
				<section className="checkout-card">
					<div className="checkout-stripe-buy text-md-center">
						{/* Stripe Buy Button */}
						<stripe-buy-button
							buy-button-id="buy_btn_1TKIFWQR8aaUqJtoH4ydCPmb"
							publishable-key="pk_live_51SroMlQR8aaUqJto9xB53Tw9vYdZEY1iusi56ELysrzeCIT1S65WDS2vKTeGIUemT6m4tTqFDiQG74atw93HabaD00IwZxhQar"
						></stripe-buy-button>
						<Script
							async
							src="https://js.stripe.com/v3/buy-button.js"
							strategy="afterInteractive"
						/>
					</div>
					<figure className="checkout-qr">
						<Image
							src="/assets/stripe/tjm-stripe.png"
							alt={t("qrCaption")}
							width={880}
							height={1055}
							decoding="async"
							priority
						/>
						<figcaption className="checkout-qr-caption">
							{t("qrCaption")}
						</figcaption>
					</figure>
					<p className="checkout-footer">
						<a href={locale === "fr" ? "/fr" : "/"}>{site("backHome")}</a>
					</p>
				</section>
			</main>
		</div>
	);
}
