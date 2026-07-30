export type PaymentLocale = "en" | "fr";

export function paymentLocale(locale: string): PaymentLocale {
  return locale === "fr" ? "fr" : "en";
}

export const DIRECT_STRIPE_PAYMENT_LINK =
  "https://buy.stripe.com/9B65kF1Gd8hHcr2d69cV200";

export const paymentCopy = {
  en: {
    checkoutTitle: "Payment",
    checkoutSubtitle: "Secure one-time payment via Stripe Checkout.",
    checkoutButton: "Proceed to secure checkout",
    qrAlt: "QR code to open this Stripe payment on your phone",
    qrCaption: "Or scan this QR code to pay on your phone",
    back: "Back to site",
  },
  fr: {
    checkoutTitle: "Paiement",
    checkoutSubtitle: "Paiement unique sécurisé via Stripe Checkout.",
    checkoutButton: "Accéder au paiement sécurisé",
    qrAlt: "Code QR pour ouvrir ce paiement Stripe sur votre téléphone",
    qrCaption: "Ou scannez ce QR code pour payer sur votre téléphone",
    back: "Retour au site",
  },
} as const;
