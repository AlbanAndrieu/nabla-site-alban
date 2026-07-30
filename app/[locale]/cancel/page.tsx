import type { Metadata } from "next";
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
  return { title: t("meta.cancelTitle"), robots: NON_INDEXABLE_ROBOTS };
}

export default async function CancelPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  if (!hasLocale(routing.locales, rawLocale)) notFound();
  const locale = paymentLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations("checkout");

  return (
    <PaymentShell locale={locale}>
      <main id="main-content" className="checkout-page">
        <section className="checkout-card checkout-result">
          <div className="result-icon result-cancel" aria-hidden="true">
            <i className="fa-solid fa-circle-xmark" />
          </div>
          <h1 className="checkout-title">{t("cancel.title")}</h1>
          <p className="checkout-message">{t("cancel.message")}</p>
          <p className="checkout-message">
            {t("cancel.beforeDirectLink")}
            <a href={DIRECT_STRIPE_PAYMENT_LINK} rel="noopener noreferrer">
              {t("cancel.directLink")}
            </a>
            {t("cancel.beforeSepa")}
            <a href={`/${locale}/payment#pay-sepa`}>{t("cancel.sepa")}</a>.
          </p>
          <p className="checkout-actions">
            <a href={`/${locale}/payment`} className="checkout-button">
              {t("cancel.paymentOptions")}
            </a>
            <a
              href={`/${locale}`}
              className="checkout-button checkout-button-secondary"
            >
              {t("cancel.backSite")}
            </a>
          </p>
        </section>
      </main>
    </PaymentShell>
  );
}
