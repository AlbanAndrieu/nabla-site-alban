import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import SiteWidgetsScript from "@/components/SiteWidgetsScript";
import TopAnchor from "@/components/TopAnchor";
import { routing } from "@/i18n/routing";
import { canonicalPagePath, pageAlternates } from "@/lib/sitePageCatalog";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/link">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "linkPage" });

  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
    alternates: pageAlternates("link", locale),
  };
}

export default async function LinkPage({
  params,
}: PageProps<"/[locale]/link">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const [site, t] = await Promise.all([
    getTranslations("site"),
    getTranslations("linkPage"),
  ]);
  const homeHref = locale === "fr" ? "/fr" : "/";
  const nablaHref = canonicalPagePath("nabla", locale);
  return (
    <div className="site-content-page page-dark">
      <TopAnchor />
      <a href="#main-content" className="skip-to-main">
        {site("skipToMainContent")}
      </a>
      <main id="main-content" className="container py-4 pb-5">
        <header className="mb-4 text-center">
          <h1 className="h2 mb-2">{t("title")}</h1>
          <p className="section-subtitle mb-0">
            {t("introBeforeLink")} <a href={nablaHref}>Nabla</a>{" "}
            {t("introAfterLink")}
          </p>
        </header>

        <section className="py-2" aria-labelledby="profiles-grid-heading">
          <h2 id="profiles-grid-heading" className="visually-hidden">
            {t("profilesHeading")}
          </h2>
          <div className="tools-grid">
            <div className="tool-item">
              <a
                href="https://github.com/AlbanAndrieu"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="/assets/logo-github-simple.png"
                  alt="GitHub"
                  width={220}
                  height={220}
                />
                <h4>GitHub</h4>
              </a>
            </div>
            <div className="tool-item">
              <a
                href="https://sonarcloud.io/organizations/albanandrieu-github/projects"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="/assets/logo-sonar.png"
                  alt="SonarCloud"
                  width={470}
                  height={187}
                />
                <h4>SonarCloud</h4>
              </a>
            </div>
            <div className="tool-item">
              <a
                href="https://hub.docker.com/u/nabla"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="/assets/logo-docker-hub-simple.png"
                  alt="Docker Hub"
                  width={1000}
                  height={1000}
                />
                <h4>Docker Hub</h4>
              </a>
            </div>
            <div className="tool-item">
              <a
                href="https://nexus.albandrieu.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="/assets/logo-nexus.png"
                  alt="Sonatype Nexus Repository"
                  width={357}
                  height={144}
                />
                <h4>Nexus</h4>
              </a>
            </div>
          </div>
        </section>

        <section className="py-4 mt-2" aria-labelledby="freelance-refs-heading">
          <h2 id="freelance-refs-heading" className="h4 text-center mb-4">
            {t("freelanceHeading")}
          </h2>
          <div className="tools-grid">
            <div className="tool-item">
              <a
                href="https://www.malt.fr/profile/albanandrieu"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="d-block mb-3" aria-hidden="true">
                  <i className="fa-solid fa-briefcase fa-3x"></i>
                </span>
                <h4>Malt</h4>
              </a>
            </div>
            <div className="tool-item">
              <a
                href="https://www.linkedin.com/in/nabla/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="/assets/fontawesome-free-7.1.0-web/svgs/brands/linkedin-in.svg"
                  alt="LinkedIn"
                  width={448}
                  height={512}
                />
                <h4>LinkedIn</h4>
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteWidgetsScript printPdf coffeeFab axeptio />
    </div>
  );
}
