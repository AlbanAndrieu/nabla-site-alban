// app/[locale]/checkout/page.tsx

import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { NON_INDEXABLE_ROBOTS } from "@/lib/sitePageCatalog";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/checkout">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "checkout" });
  return { title: t("meta.checkoutTitle"), robots: NON_INDEXABLE_ROBOTS };
}

export default async function CheckoutPage({
  params,
}: PageProps<"/[locale]/checkout">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("checkout");

  return (
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
            src="/assets/nabla/nabla-4.svg"
            alt="Nabla"
            width={64}
            height={64}
            priority
          />
          <div className="description">
            <h1 className="checkout-title">{t("page.title")}</h1>
            <p className="checkout-subtitle">{t("page.subtitle")}</p>
          </div>
        </div>
        <figure className="checkout-qr">
          <Image
            src="/assets/stripe/tjm-stripe.png"
            alt={t("page.qrAlt")}
            width={880}
            height={1055}
            priority
          />
          <figcaption className="checkout-qr-caption">
            {t("page.qrCaption")}
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
            {t("page.submit")}
          </button>
        </form>
        {/* lien back to site supprimé comme demandé */}
      </section>
    </main>
  );
}
