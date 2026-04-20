"use server";

import { stripe } from "@/lib/stripe";

type CatalogProduct = {
	name: string;
	description: string;
	priceInCents: number;
};

/** Replace or extend with a real catalog (DB, CMS, Stripe Products API). */
async function getProduct(productId: string): Promise<CatalogProduct> {
	const catalog: Record<string, CatalogProduct> = {
		default: {
			name: "Purchase",
			description: "",
			priceInCents: 750,
		},
	};
	const product = catalog[productId] ?? catalog.default;
	return { ...product, description: product.description || product.name };
}

export async function startCheckoutSession(productId: string) {
	const product = await getProduct(productId);

	// Create Checkout Sessions from body params.
	const session = await stripe.checkout.sessions.create({
		ui_mode: "embedded",
		redirect_on_completion: "never",
		line_items: [
			{
				price_data: {
					currency: "usd",
					product_data: {
						name: product.name,
						description: product.description,
					},
					unit_amount: product.priceInCents,
				},
				quantity: 1,
			},
		],
		mode: "payment",
	});

	return session.client_secret;
}
