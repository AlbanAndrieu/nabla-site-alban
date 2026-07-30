import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import TopAnchor from "@/components/TopAnchor";
import { routing } from "@/i18n/routing";
import { paymentLocale } from "@/lib/paymentPages";
import { PRICING_TIERS } from "@/lib/pricingTiers";
import { NON_INDEXABLE_ROBOTS } from "@/lib/sitePageCatalog";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = paymentLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "pricing" });
  return {
    title: `${t("title")} — Alban Andrieu`,
    description: t("intro"),
    robots: NON_INDEXABLE_ROBOTS,
  };
}

export default async function PricingPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  if (!hasLocale(routing.locales, rawLocale)) notFound();
  const locale = paymentLocale(rawLocale);
  setRequestLocale(locale);
  const [site, t] = await Promise.all([
    getTranslations("site"),
    getTranslations("pricing"),
  ]);
  const how = t.raw("how") as string[];
  const addons = t.raw("addons") as string[];

  return (
    <div className="site-content-page page-dark">
      <TopAnchor />
      <a href="#main-content" className="skip-to-main">
        {site("skipToMainContent")}
      </a>
      <main id="main-content" className="container py-4 pb-5 pricing-page">
        <header className="mb-4">
          <h1 className="h2 mb-2">{t("title")}</h1>
          <p className="lead text-secondary mb-0">{t("intro")}</p>
        </header>
        <section className="py-3" aria-labelledby="how-pricing-works">
          <h2 id="how-pricing-works" className="h4 mb-3">
            {t("howTitle")}
          </h2>
          <ul>
            {how.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section className="py-3" aria-label={t("tiersAriaLabel")}>
          <div className="pricing-tier-grid">
            {PRICING_TIERS[locale].map((tier) => (
              <article
                className="pricing-tier-card card h-100 bg-body-secondary border-secondary"
                id={tier.id}
                key={tier.id}
              >
                <div className="card-body d-flex flex-column">
                  <h2 className="h5 card-title">
                    <i
                      className={`fas ${tier.icon} text-primary`}
                      aria-hidden="true"
                    />{" "}
                    {tier.title}
                  </h2>
                  <p className="pricing-tier-range">
                    <strong>{tier.range}</strong>
                  </p>
                  <p className="card-text text-secondary small mb-2">
                    {tier.summary}
                  </p>
                  <ul className="small mb-3 flex-grow-1">
                    {tier.bullets.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <a
                    href={tier.href}
                    className="btn btn-outline-primary btn-sm"
                  >
                    {tier.cta}
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="py-3" aria-labelledby="addons-heading">
          <h2 id="addons-heading" className="h4 mb-3">
            {t("addonsTitle")}
          </h2>
          <div className="card border-secondary bg-body-secondary">
            <div className="card-body">
              <ul className="mb-0">
                {addons.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
        <section className="py-3" aria-labelledby="pricing-next-step">
          <h2 id="pricing-next-step" className="h4 mb-3">
            {t("nextTitle")}
          </h2>
          <p>{t("next")}</p>
          <div className="d-flex flex-wrap gap-2">
            <a
              href="https://calendly.com/alban-andrieu"
              className="btn btn-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("book")}
            </a>
            <a
              href={`/${locale}/expertise#services`}
              className="btn btn-outline-secondary"
            >
              {t("services")}
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
