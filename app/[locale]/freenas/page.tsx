import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import SiteWidgetsScript from "@/components/SiteWidgetsScript";
import TopAnchor from "@/components/TopAnchor";
import { routing } from "@/i18n/routing";
import { NON_INDEXABLE_ROBOTS } from "@/lib/sitePageCatalog";
import HeroSection from "../../components/freenas/HeroSection";
import JenkinsAndPluginsSection from "../../components/freenas/JenkinsAndPluginsSection";
import MonitoringAndGamingSection from "../../components/freenas/MonitoringAndGamingSection";

export const metadata: Metadata = { robots: NON_INDEXABLE_ROBOTS };

export default async function FreenasPage({
  params,
}: PageProps<"/[locale]/freenas">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const tSite = await getTranslations("site");
  return (
    <div className="site-content-page page-dark">
      <TopAnchor />
      <a href="#main-content" className="skip-to-main">
        {tSite("skipToMainContent")}
      </a>
      <main id="main-content" className="container py-4 pb-5">
        <HeroSection />
        <JenkinsAndPluginsSection />
        <MonitoringAndGamingSection />
      </main>
      <SiteWidgetsScript printPdf coffeeFab />
    </div>
  );
}
