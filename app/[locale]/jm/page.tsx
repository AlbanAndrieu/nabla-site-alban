import React from "react";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

export const dynamic = "force-static";

// Correction Next.js 15: params is Promise
export default async function JusmundiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const jm = await getTranslations("jm");
  const site = await getTranslations("site");

  return (
    <>
      <link rel="stylesheet" href="/jm/jusmundi.css" />
      <main className="jusmundi-page jusmundi-landing-page page-dark">
        <a name="top" />
        <a href="#main-content" className="skip-link">
          {site("skipToMainContent")}
        </a>
        <nav className="page-nav container py-3 d-flex flex-wrap align-items-center gap-2" aria-label="Breadcrumb">
          <Link href={`/${locale}`} className="text-decoration-none" aria-label="Back to Main">
            <span aria-hidden="true">←</span> {jm("footer.returnToCv")}
          </Link>
        </nav>
        <main id="main-content" role="main" className="container py-4 pb-5">
          <section className="hero-section jusmundi-hero-compact" aria-labelledby="hero-heading">
            <div className="hero-content">
              <h1 className="hero-title" id="hero-heading">{jm("heroTitle")}</h1>
              <p className="hero-subtitle">{jm("heroSubtitle")}</p>
            </div>
          </section>
          <section className="proof-section jusmundi-landing-content jusmundi-kpi-section" aria-labelledby="kpis-heading">
            <h2 className="section-title" id="kpis-heading">{jm("kpisHeading")}</h2>
            <p className="section-subtitle">{jm("kpisSubtitle")}</p>
            <div className="kpi-grid">
              <div className="kpi-card"><span className="value">{jm("kpiTasksCompleted")}</span><span className="label">Tasks completed</span></div>
              <div className="kpi-card"><span className="value">{jm("kpiPlatformUptime")}</span><span className="label">Platform uptime (SLA)</span></div>
              <div className="kpi-card"><span className="value">{jm("kpiSecurityBreaches")}</span><span className="label">Security breaches</span></div>
              <div className="kpi-card"><span className="value">{jm("kpiMttrP1")}</span><span className="label">MTTR (P1)</span></div>
              <div className="kpi-card"><span className="value">{jm("kpiAlertNoiseReduction")}</span><span className="label">Alert noise reduction</span></div>
              <div className="kpi-card"><span className="value">{jm("kpiAnnualSavings")}</span><span className="label">Est. annual savings</span></div>
            </div>
          </section>

          {/* Security Band */}
          <section className="infra-migration-band" aria-labelledby="security-focus-highlight-heading">
            <div className="infra-migration-band-layout">
              <div className="infra-migration-band-figure" aria-hidden="true"><i className="fas fa-shield-halved" /></div>
              <div className="engagement-block infra-migration-band-body">
                <p className="infra-top-achievement-pill"><i className="fas fa-trophy" aria-hidden="true" /><span>Top #1 achievement</span></p>
                <h3 id="security-focus-highlight-heading">{jm("securityBandHeading")}</h3>
                <p className="infra-migration-lead">{jm("securityBandLead")}</p>
                <ul>{jm.raw("securityBand").map((entry: string, idx: number) => (<li key={idx}>{entry}</li>))}</ul>
              </div>
            </div>
          </section>

          {/* K8s/Infra Band */}
          <section className="infra-migration-band infra-migration-band--k8s" aria-labelledby="infra-k8s-us-heading">
            <div className="infra-migration-band-layout">
              <div className="infra-migration-band-figure" aria-hidden="true"><i className="fas fa-network-wired" /></div>
              <div className="engagement-block infra-migration-band-body">
                <p className="infra-top-achievement-pill"><i className="fas fa-trophy" aria-hidden="true" /><span>Top #2 achievement</span></p>
                <h3 id="infra-k8s-us-heading">{jm("infraBandHeading")}</h3>
                <p className="infra-migration-lead">{jm("infraBandLead")}</p>
                <ul>{jm.raw("infraBand").map((entry: string, idx: number) => (<li key={idx}>{entry}</li>))}</ul>
              </div>
            </div>
          </section>

          {/* AI Band */}
          <section className="infra-migration-band infra-migration-band--ai" aria-labelledby="ai-company-transition-heading">
            <div className="infra-migration-band-layout">
              <div className="infra-migration-band-figure" aria-hidden="true"><i className="fas fa-brain" /></div>
              <div className="engagement-block infra-migration-band-body">
                <p className="infra-top-achievement-pill"><i className="fas fa-trophy" aria-hidden="true" /><span>Top #3 achievement</span></p>
                <h3 id="ai-company-transition-heading">{jm("aiBandHeading")}</h3>
                <p className="infra-migration-lead">{jm("aiBandLead")}</p>
                <ul>{jm.raw("aiBand").map((entry: string, idx: number) => (<li key={idx}>{entry}</li>))}</ul>
              </div>
            </div>
          </section>

          {/* Achievements by Area */}
          <section className="services-section jusmundi-landing-content" aria-labelledby="achievements-heading">
            <h2 className="section-title" id="achievements-heading">{jm("achievementsHeading")}</h2>
            <p className="section-subtitle">{jm("achievementsSubtitle")}</p>
            <div className="services-grid jusmundi-achievements-by-area-grid">
              {/* SEO Card */}
              <div className="service-card" aria-labelledby="seo-heading">
                <div className="service-icon" aria-hidden="true"><i className="fas fa-search"></i></div>
                <h3 id="seo-heading">{jm("achievements.seo.title")}</h3>
                <p className="service-lead">{jm("achievements.seo.lead")}</p>
                <ul className="service-bullets">{jm.raw("achievements.seo.bullets").map((entry: string, idx: number) => (<li key={idx}>{entry}</li>))}</ul>
              </div>
              {/* SLA Card */}
              <div className="service-card" aria-labelledby="sla-heading">
                <div className="service-icon" aria-hidden="true"><i className="fas fa-chart-line"></i></div>
                <h3 id="sla-heading">{jm("achievements.sla.title")}</h3>
                <p className="service-lead">{jm("achievements.sla.lead")}</p>
                <ul className="service-bullets">{jm.raw("achievements.sla.bullets").map((entry: string, idx: number) => (<li key={idx}>{entry}</li>))}</ul>
              </div>
              {/* Security & Compliance Card */}
              <div className="service-card" aria-labelledby="security-heading">
                <div className="service-icon" aria-hidden="true"><i className="fas fa-shield-halved"></i></div>
                <h3 id="security-heading">{jm("achievements.security.title")}</h3>
                <p className="service-lead">{jm("achievements.security.lead")}</p>
                <div className="badge-row">{jm.raw("achievements.security.badges").map((badge: string, idx: number) => (<span className="badge" key={idx}>{badge}</span>))}</div>
                <h4 className="jusmundi-card-h4">{jm("achievements.security.vulnTitle")}</h4>
                <ul className="service-bullets">{jm.raw("achievements.security.vulnBullets").map((entry: string, idx: number) => (<li key={idx}>{entry}</li>))}</ul>
                <h4 className="jusmundi-card-h4">{jm("achievements.security.idpTitle")}</h4>
                <ul className="service-bullets">{jm.raw("achievements.security.idpBullets").map((entry: string, idx: number) => (<li key={idx}>{entry}</li>))}</ul>
                <h4 className="jusmundi-card-h4">{jm("achievements.security.complianceTitle")}</h4>
                <ul className="service-bullets">{jm.raw("achievements.security.complianceBullets").map((entry: string, idx: number) => (<li key={idx}>{entry}</li>))}</ul>
              </div>
              {/* Platform Card */}
              <div className="service-card" aria-labelledby="other-heading">
                <div className="service-icon" aria-hidden="true"><i className="fas fa-server"></i></div>
                <h3 id="other-heading">{jm("achievements.platform.title")}</h3>
                <p className="service-lead">{jm("achievements.platform.lead")}</p>
                <ul className="service-bullets">{jm.raw("achievements.platform.bullets").map((entry: string, idx: number) => (<li key={idx}>{entry}</li>))}</ul>
              </div>
            </div>
          </section>

          {/* Overall estimate section */}
          <section className="proof-section jusmundi-landing-content" aria-labelledby="overall-heading">
            <h2 className="section-title" id="overall-heading">{jm("overallHeading")}</h2>
            <div className="service-card jusmundi-service-card-wide">
              <ul>{jm.raw("overallBullets").map((entry: string, idx: number) => (<li key={idx}>{entry}</li>))}</ul>
            </div>
          </section>

          {/* Related documents section */}
          <section className="proof-section jusmundi-landing-content" aria-labelledby="documents-heading">
            <h2 className="section-title" id="documents-heading">{jm("relatedDocumentsHeading")}</h2>
            <p className="section-subtitle">{jm("relatedDocumentsSubtitle")}</p>
            <div className="services-grid">
              {jm.raw("relatedDocuments").map((doc: any, idx: number) => (
                <article className="service-card jusmundi-doc-card position-relative" key={idx}>
                  <div className="service-icon" aria-hidden="true"><i className={doc.iconClass}></i></div>
                  <h3>
                    <Link href={doc.link} className="stretched-link text-decoration-none">{doc.title}</Link>
                  </h3>
                  <p className="service-lead">
                    {doc.description}
                    {doc.externalLink && <>
                      ( <a href={doc.externalLink.href} target="_blank" rel="noopener noreferrer" className="jusconnect-product-link">{doc.externalLink.label}<i className="fas fa-up-right-from-square ms-1" aria-hidden="true"></i><span className="visually-hidden"> (opens in new tab)</span></a> )
                    </>}
                  </p>
                </article>
              ))}
            </div>
          </section>

        </main>

        {/* Footer */}
        <footer className="footer" role="contentinfo">
          <div className="social-links">
            <a href="https://www.linkedin.com/in/nabla" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="LinkedIn"><i className="fab fa-linkedin-in"></i></a>
            <a href="https://calendly.com/alban-andrieu" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Calendly"><i className="fa fa-calendar-plus"></i></a>
            <a href="https://github.com/AlbanAndrieu" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="GitHub"><i className="fab fa-github"></i></a>
            <a href="https://hub.docker.com/u/nabla" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Docker Hub"><i className="fab fa-docker"></i></a>
            <a href="https://stackexchange.com/users/4652074/albanandrieu" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Stack Exchange"><i className="fab fa-stack-exchange"></i></a>
          </div>
          <div className="footer-links">
            <a href="/pricing.html">{jm("footer.pricing")}</a>
            <a href="/policy/legal.html">{jm("footer.legal")}</a>
            <a href="javascript:openAxeptioCookies()" rel="noopener noreferrer" className="text-muted">{jm("footer.cookies")}</a>
          </div>
          <p className="text-md-center mt-3">
            <Link href={`/${locale}`} className="btn btn-sm btn-outline-secondary">{jm("footer.returnToCv")}</Link>
            <a href="#top" className="btn btn-sm btn-outline-secondary ms-2" aria-label={site("backToTopAria")}>{jm("footer.backToTop")}</a>
          </p>
          <p className="text-muted small mt-2">{jm("footer.summary")}</p>
        </footer>
      </main>
    </>
  );
}
