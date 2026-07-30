"use client";

import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import { startCheckoutSession } from "@/app/actions/stripe";

const publishableKey =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";

export default function Checkout({ productId }: { productId: string }) {
  const t = useTranslations("checkout");
  const stripePromise = useMemo(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [],
  );

  const fetchClientSecret = useCallback(async () => {
    const clientSecret = await startCheckoutSession(productId);
    if (!clientSecret) {
      throw new Error(t("sessionCreateError"));
    }
    return clientSecret;
  }, [productId, t]);

  if (!stripePromise) {
    return (
      <div id="checkout" role="alert">
        {t("missingPublishableKey")}
      </div>
    );
  }

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{ fetchClientSecret }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
