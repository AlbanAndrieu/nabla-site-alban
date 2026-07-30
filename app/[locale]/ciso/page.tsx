import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ThreatFeed from "@/components/ciso/ThreatFeed";
import TopAnchor from "@/components/TopAnchor";
import { type AppLocale, routing } from "@/i18n/routing";
import { pageAlternates } from "@/lib/sitePageCatalog";

type Props = { params: Promise<{ locale: string }> };

const compliance = [
  ["fa-user-shield", "GDPR / RGPD", "95%"],
  ["fa-shield-halved", "ISO 27001", "100%"],
  ["fa-brain", "ISO 42001", "100%"],
  ["fa-clipboard-check", "SOC 2", "In progress"],
  ["fa-credit-card", "PCI DSS", "10%"],
] as const;

type MetricItem = readonly [icon: string, label: string, value: string];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "ciso" });
  return {
    title: `${t("title")} — Alban Andrieu`,
    description: t("subtitle"),
    alternates: pageAlternates("ciso", locale),
  };
}

export default async function CisoPage({ params }: Props) {
  const { locale: requestedLocale } = await params;
  if (!hasLocale(routing.locales, requestedLocale)) notFound();
  const locale = requestedLocale as AppLocale;
  setRequestLocale(locale);
  const [site, t] = await Promise.all([
    getTranslations("site"),
    getTranslations("ciso"),
  ]);
  const metrics = t.raw("metricItems") as MetricItem[];

  return (
    <>
      <TopAnchor />
      <a className="skip-to-main" href="#main-content">
        {site("skipToMainContent")}
      </a>
      <main id="main-content" className="site-content-page page-ciso page-dark">
        <section
          className="hero-section ciso-hero"
          aria-labelledby="ciso-title"
        >
          <div className="hero-content">
            <h1 id="ciso-title" className="hero-title">
              <i className="fa-solid fa-shield-halved" aria-hidden="true" />{" "}
              {t("title")}
            </h1>
            <p className="hero-subtitle">{t("subtitle")}</p>
            <p className="hero-description">
              {t("curatedBy")} <a href={`/${locale}/contact`}>Alban Andrieu</a>
            </p>
          </div>
        </section>

        <div className="ciso-content">
          <section
            className="ciso-card ciso-card--wide ciso-card--centered"
            aria-labelledby="compliance-heading"
          >
            <h2 id="compliance-heading">
              <i className="fa-solid fa-certificate" aria-hidden="true" />{" "}
              {t("compliance")}
            </h2>
            <p>{t("complianceIntro")}</p>
            <dl className="ciso-compliance-grid">
              {compliance.map(([icon, label, value]) => (
                <div key={label}>
                  <dt>
                    <i className={`fa-solid ${icon}`} aria-hidden="true" />
                    <span>{label}</span>
                  </dt>
                  <dd>{value === "In progress" ? t("inProgress") : value}</dd>
                </div>
              ))}
            </dl>
            <p>{t("audit")}</p>
            <a
              className="resource-link"
              href="https://checklist.albandrieu.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("checklist")}{" "}
              <i
                className="fa-solid fa-arrow-up-right-from-square"
                aria-hidden="true"
              />
            </a>
          </section>

          <section
            className="ciso-card ciso-card--wide ciso-card--centered"
            aria-labelledby="metrics-heading"
          >
            <h2 id="metrics-heading">
              <i className="fa-solid fa-chart-line" aria-hidden="true" />{" "}
              {t("metrics")}
            </h2>
            <div className="ciso-metrics">
              {metrics.map(([icon, label, value]) => (
                <article className="ciso-metric" key={label}>
                  <i
                    className={`fa-solid ${icon} ciso-metric-icon`}
                    aria-hidden="true"
                  />
                  <h3>{label}</h3>
                  <p>{value}</p>
                </article>
              ))}
            </div>
          </section>

          <section
            className="ciso-card ciso-card--wide"
            aria-labelledby="threats-heading"
          >
            <h2 id="threats-heading">
              <i className="fa-solid fa-globe" aria-hidden="true" />{" "}
              {t("threats")}
            </h2>
            <p>{t("threatsIntro")}</p>
            <ThreatFeed locale={locale} />
          </section>
        </div>
      </main>
    </>
  );
}
