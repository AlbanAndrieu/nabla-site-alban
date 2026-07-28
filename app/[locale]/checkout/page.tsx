// app/[locale]/checkout/page.tsx

import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
	title: "Checkout | Alban Andrieu",
	robots: { index: false, follow: false },
};

export default async function CheckoutPage({
	params,
}: PageProps<"/[locale]/checkout">) {
	const { locale } = await params;
	const isFr = locale === "fr";

	return (
		<>
			<main
				id="main-content"
				className="checkout-page site-content-page"
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					minHeight: "80vh",
				}}
			>
				<section className="checkout-card" style={{ margin: "auto" }}>
					<div className="product">
						<Image
							src="https://albanandrieu.com/assets/nabla/nabla-4.svg"
							alt={isFr ? "Nabla" : "Nabla"}
							width={64}
							height={64}
							priority
						/>
						<div className="description">
							<h2 className="checkout-title">
								{isFr ? "Paiement" : "Payment"}
							</h2>
							<p className="checkout-subtitle">
								{isFr
									? "Paiement unique via Stripe. Paiement sécurisé."
									: "One-time payment via Stripe. Secure checkout."}
							</p>
						</div>
					</div>
					<figure className="checkout-qr">
						<Image
							src="/assets/stripe/tjm-stripe.png"
							alt={
								isFr
									? "Code QR pour ouvrir ce paiement Stripe sur votre téléphone"
									: "QR code to open this Stripe payment on your phone"
							}
							width={880}
							height={1055}
							priority
						/>
						<figcaption className="checkout-qr-caption">
							{isFr
								? "Ou scannez ce QR code pour payer sur votre téléphone"
								: "Or scan this QR code to pay on your phone"}
						</figcaption>
					</figure>
					<form
						action="/api/create-checkout-session"
						method="POST"
						className="checkout-form"
					>
						<button
							type="submit"
							id="checkout-button"
							className="checkout-button"
						>
							<i className="fa-solid fa-lock" aria-hidden="true"></i>
							{isFr ? " Passer à la caisse" : " Proceed to checkout"}
						</button>
					</form>
					{/* lien back to site supprimé comme demandé */}
				</section>
			</main>
		</>
	);
}
