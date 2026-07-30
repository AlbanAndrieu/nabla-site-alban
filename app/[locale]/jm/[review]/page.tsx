import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { NON_INDEXABLE_ROBOTS } from "@/lib/sitePageCatalog";

const reviews = {
  "4-years-review-aandrieu": {
    title: "4-Year Performance Summary — Alban Andrieu (2022–2025) | Jusmundi",
    description:
      "Alban Andrieu 4-year performance at Jusmundi: infrastructure, security, databases, CI/CD and observability.",
    detailed: true,
  },
  "4-years-review-jusmundi": {
    title: "JusMundi Global Achievements (2022–2025) | Alban Andrieu",
    description:
      "JusMundi company overview, product launches, expansion and AI transformation summary.",
    detailed: false,
  },
  "yearly-review-2025-aandrieu": {
    title: "Alban Andrieu — Tasks Completed in 2025 | Jusmundi",
    description:
      "Summary of tasks completed in 2025 across security, infrastructure, databases, AI, observability and CI/CD.",
    detailed: false,
  },
} as const;

type Review = keyof typeof reviews;
type Props = { params: Promise<{ locale: string; review: string }> };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    Object.keys(reviews).map((review) => ({ locale, review })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { review } = await params;
  const config = reviews[review as Review];
  return config
    ? {
        title: config.title,
        description: config.description,
        robots: NON_INDEXABLE_ROBOTS,
      }
    : {};
}

export default async function ReviewPage({ params }: Props) {
  const { locale, review } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const config = reviews[review as Review];
  if (!config) notFound();

  setRequestLocale(locale);
  const t = await getTranslations("jm.4years");

  return (
    <>
      <link rel="stylesheet" href="/jm/jusmundi.css" precedence="page" />
      <main className="container py-4 pb-5">
        <section
          className="hero-section jusmundi-hero-compact"
          aria-labelledby="hero-heading"
        >
          <div className="hero-content">
            <h1 className="hero-title" id="hero-heading">
              {t("headline")}
            </h1>
            <p className="hero-subtitle">{t("lead")}</p>
          </div>
        </section>
        {config.detailed ? (
          <>
            <section
              className="proof-section jusmundi-landing-content"
              aria-labelledby="exec-heading"
            >
              <h2 className="section-title" id="exec-heading">
                {t("executive_title")}
              </h2>
              <div className="service-card jusmundi-service-card-wide">
                <p>{t("executive_copy")}</p>
              </div>
            </section>
            <section
              className="proof-section jusmundi-landing-content"
              aria-labelledby="achievements-heading"
            >
              <h2 className="section-title" id="achievements-heading">
                {t("key_achievements")}
              </h2>
            </section>
          </>
        ) : null}
      </main>
    </>
  );
}
