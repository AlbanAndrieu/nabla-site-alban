import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import ThreatFeed from "@/components/ciso/ThreatFeed";
import SiteWidgetsScript from "@/components/SiteWidgetsScript";
import TopAnchor from "@/components/TopAnchor";
import { NON_INDEXABLE_ROBOTS } from "@/lib/sitePageCatalog";

export const metadata: Metadata = { robots: NON_INDEXABLE_ROBOTS };

export default async function CTIDPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ctid");
  // On retire tout le <nav> local
  return (
    <div className="site-content-page page-ciso page-dark">
      <TopAnchor />
      <main id="main-content">
        <section
          className="hero-section ciso-hero"
          aria-labelledby="ctid-title"
        >
          <div className="hero-content">
            <h1 id="ctid-title" className="hero-title">
              <i className="fa-solid fa-shield-halved" aria-hidden="true" />{" "}
              {t("title")}
            </h1>
            <div
              role="img"
              aria-label={t("heroImageLabel")}
              style={{ fontSize: "2rem" }}
            >
              {t("hero")}
            </div>
            <p className="hero-subtitle">{t("subtitle")}</p>
            <p className="hero-description">{t("description")}</p>
          </div>
        </section>
        <section
          className="ciso-card ciso-card--wide ciso-card--centered"
          aria-labelledby="ctid-threats-heading"
        >
          <h2 id="ctid-threats-heading">
            <i className="fa-solid fa-globe" aria-hidden="true" />{" "}
            {t("threatFeedTitle")}
          </h2>
          <p>{t("threatFeedIntro")}</p>
          <ThreatFeed
            locale={locale as "en" | "fr"}
            labels={{
              loading: t("threatFeed.loading"),
              error: t("threatFeed.error"),
              retry: t("threatFeed.retry"),
              opensInNewTab: t("threatFeed.opensInNewTab"),
            }}
          />
        </section>
      </main>
      <SiteWidgetsScript />
    </div>
  );
}
