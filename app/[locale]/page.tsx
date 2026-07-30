import Image from "next/image";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Hero from "@/app/components/Hero";
import JsonLd from "@/components/JsonLd";
import SiteWidgetsScript from "@/components/SiteWidgetsScript";
import TopAnchor from "@/components/TopAnchor";
import { routing } from "@/i18n/routing";
import { HOME_JSON_LD, HOME_JSON_LD_FR } from "@/lib/htmlFromPublic";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const t = await getTranslations("home");
  const site = await getTranslations("site");
  const prefix = locale === "fr" ? "/fr" : "";

  return (
    <>
      <JsonLd data={locale === "fr" ? HOME_JSON_LD_FR : HOME_JSON_LD} />
      <link rel="stylesheet" href="/timeline.css" precedence="page" />
      <link rel="stylesheet" href="/education.css" precedence="page" />
      <TopAnchor />
      <a href="#main-content" className="skip-to-main">
        {site("skipToMainContent")}
      </a>
      <main id="main-content">
        <Hero />

        <section
          className="proof-section"
          id="outcomes"
          aria-labelledby="outcomes-heading"
        >
          <h2 className="section-title" id="outcomes-heading">
            {t("outcomes.title")}
          </h2>
          <p className="section-subtitle">{t("outcomes.engagements")}</p>
          <div className="proof-grid">
            {(["legal", "devops", "platform"] as const).map((domain) => (
              <div className="proof-card" key={domain}>
                <h3>{t(`outcomes.${domain}.title`)}</h3>
                <p className="proof-context">
                  {t(`outcomes.${domain}.context`)}
                </p>
                <ul>
                  <li>{t(`outcomes.${domain}.pt1`)}</li>
                  <li>{t(`outcomes.${domain}.pt2`)}</li>
                  <li>{t(`outcomes.${domain}.pt3`)}</li>
                </ul>
              </div>
            ))}
          </div>
          <p className="section-subtitle mt-4 mb-0">
            <a href={`${prefix}/expertise.html`}>{t("outcomes.detail")}</a>
          </p>
        </section>

        <section className="timeline-section" id="timeline">
          <br />
          <h2 className="section-title">{t("timeline.title")}</h2>
          <p className="section-subtitle">{t("timeline.subtitle")}</p>
          <div className="timeline">
            <TimelineItem
              icon="fa-briefcase"
              date={t("timeline.freelance.date")}
              title={t("timeline.freelance.title")}
            >
              <p className="timeline-description">
                {t("timeline.freelance.desc")}
              </p>
            </TimelineItem>
            <TimelineItem
              icon="fa-cloud"
              date={t("timeline.architect.date")}
              title={t("timeline.architect.title")}
              company={
                <a
                  href="https://www.jusmundi.com"
                  className="timeline-company"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Image
                    alt=""
                    aria-hidden="true"
                    className="jusmundi-link-icon"
                    decoding="async"
                    height={16}
                    src="/assets/nabla/jusmundi-favicon.ico"
                    width={16}
                  />
                  {t("timeline.company.jusmundi")}
                </a>
              }
            >
              <p className="timeline-description">
                {t("timeline.architect.desc")}{" "}
                <a className="timeline-company" href={`${prefix}/jm`}>
                  {t("timeline.architect.more")}
                </a>
              </p>
              <AchievementTags
                values={[
                  t("timeline.architect.ach1"),
                  t("timeline.architect.ach2"),
                  t("timeline.architect.ach3"),
                  t("timeline.architect.ach4"),
                ]}
              />
            </TimelineItem>
            <TimelineItem
              icon="fa-handshake"
              date={t("timeline.engineer.date")}
              title={t("timeline.engineer.title")}
              company={
                <span className="timeline-company">
                  {t("timeline.engineer.company")}
                </span>
              }
            >
              <p className="timeline-description">
                {t("timeline.engineer.desc")}
              </p>
              <AchievementTags
                values={[
                  t("timeline.engineer.ach1"),
                  t("timeline.engineer.ach2"),
                  t("timeline.engineer.ach3"),
                  t("timeline.engineer.ach4"),
                  t("timeline.engineer.ach5"),
                ]}
              />
            </TimelineItem>
            <TimelineItem
              icon="fa-code"
              date={t("timeline.senior.date")}
              title={t("timeline.senior.title")}
              company={
                <span className="timeline-company">
                  {t("timeline.senior.company")}
                </span>
              }
            >
              <p className="timeline-description">
                {t("timeline.senior.desc")}
              </p>
              <AchievementTags
                values={[
                  t("timeline.senior.ach1"),
                  t("timeline.senior.ach2"),
                  t("timeline.senior.ach3"),
                  t("timeline.senior.ach4"),
                ]}
              />
            </TimelineItem>
            <TimelineItem
              icon="fa-graduation-cap"
              date={t("timeline.degree.date")}
              title={t("timeline.degree.title")}
              company={
                <span className="timeline-company">
                  {t("timeline.degree.company")}
                </span>
              }
            >
              <p className="timeline-description">
                {t("timeline.degree.desc")}
              </p>
            </TimelineItem>
            <TimelineItem icon="fa-circle" date="" title="">
              <span aria-hidden="true" />
            </TimelineItem>
          </div>
          <div className="cta-buttons">
            <a className="btn btn-primary" href={`${prefix}/cv`}>
              <i className="fas fa-file" /> {t("timeline.cvcta")}
            </a>
          </div>
          <br />
        </section>

        <section className="education-section" id="education">
          <h2 className="section-title">{t("education.title")}</h2>
          <div className="education-grid">
            <EducationCard
              icon="fa-globe"
              featured
              title={t("education.international.title")}
              org={t("education.international.org")}
            >
              {t.rich("education.international.details", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </EducationCard>
            <EducationCard
              icon="fa-graduation-cap"
              title={t("education.engineering.title")}
              org={t("education.engineering.org")}
            >
              {t("education.engineering.details")}
            </EducationCard>
            <EducationCard
              icon="fa-certificate"
              title={t("education.iso.title")}
              org={t("education.iso.org")}
            >
              {t.rich("education.iso.details", {
                strong: (chunks) => <strong>{chunks}</strong>,
                link: (chunks) => (
                  <a
                    href={`${prefix}/security.html#security-standards-compliance`}
                  >
                    {chunks}
                  </a>
                ),
              })}
            </EducationCard>
            <EducationCard
              icon="fa-cloud"
              title={t("education.cloud.title")}
              org={t("education.cloud.org")}
            >
              {t("education.cloud.details")}
            </EducationCard>
          </div>
        </section>

        <section
          className="contact-section"
          id="contact"
          aria-labelledby="contact-heading"
        >
          <h2 className="section-title" id="contact-heading">
            {t("contact.title")}
          </h2>
          <p className="section-subtitle">{t("contact.subtitle")}</p>
          <div className="cta-buttons contact-hero-ctas">
            <a
              className="btn btn-primary"
              href="https://calendly.com/alban-andrieu"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fa fa-calendar-plus" /> {t("contact.cta.calendly")}
            </a>
            <a
              className="btn btn-secondary"
              href={`mailto:${t("contact.email.value")}`}
            >
              <i className="fas fa-envelope" /> {t("contact.cta.email")}
            </a>
          </div>
          <div className="contact-methods">
            <ContactMethod
              href={`mailto:${t("contact.email.value")}`}
              icon="fas fa-envelope"
              title={t("contact.email.label")}
              value={t("contact.email.value")}
            />
            <ContactMethod
              href="https://www.linkedin.com/in/nabla"
              icon="fab fa-linkedin"
              title={t("contact.linkedin.label")}
              value={t("contact.linkedin.value")}
              external
            />
            <ContactMethod
              href="https://calendly.com/alban-andrieu"
              icon="fa fa-calendar-plus"
              title={t("contact.calendly.label")}
              value={t("contact.calendly.value")}
              external
            />
            <ContactMethod
              href="https://github.com/AlbanAndrieu"
              icon="fab fa-github"
              title={t("contact.github.label")}
              value={t("contact.github.value")}
              external
            />
          </div>
          <div className="contact-logo-wrap">
            <Image
              alt={t("contact.logo.alt")}
              className="contact-logo"
              height={120}
              src="/assets/nabla/nabla-4.svg"
              width={120}
            />
          </div>
        </section>
      </main>
      <SiteWidgetsScript printPdf />
    </>
  );
}

function TimelineItem({
  icon,
  date,
  title,
  company,
  children,
}: {
  icon: string;
  date: string;
  title: string;
  company?: React.ReactNode;
  children: React.ReactNode;
}) {
  // Pour TimelineItem d'intro (fa-circle), ne rendre que l'icône sans timeline-content ni header
  if (icon === "fa-circle") {
    return (
      <div className="timeline-item">
        <div className="timeline-node">
          <div className="timeline-node-icon" aria-hidden="true">
            <i className={`fas ${icon}`} />
          </div>
          <span className="timeline-node-date"></span>
        </div>
        <div
          className="timeline-content"
          style={{
            display: "none",
            height: 0,
            minHeight: 0,
            padding: 0,
            margin: 0,
          }}
        />
      </div>
    );
  }
  return (
    <div className="timeline-item">
      <div className="timeline-node">
        <div className="timeline-node-icon" aria-hidden="true">
          <i className={`fas ${icon}`} />
        </div>
        <span className="timeline-node-date">{date}</span>
      </div>
      <div className="timeline-content">
        <div className="timeline-header">
          <h3>{title}</h3>
          {company}
        </div>
        {children}
      </div>
    </div>
  );
}

function AchievementTags({ values }: { values: string[] }) {
  return (
    <div className="timeline-achievements">
      {values.map((value) => (
        <span className="achievement-tag" key={value}>
          {value}
        </span>
      ))}
    </div>
  );
}

function EducationCard({
  icon,
  featured = false,
  title,
  org,
  children,
}: {
  icon: string;
  featured?: boolean;
  title: string;
  org: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`education-card${featured ? " education-card--featured" : ""}`}
    >
      <div className="education-icon">
        <i className={`fas ${icon}`} aria-hidden="true" />
      </div>
      <h3>{title}</h3>
      <p className="education-institution">{org}</p>
      <p className="education-details">{children}</p>
    </div>
  );
}

function ContactMethod({
  href,
  icon,
  title,
  value,
  external = false,
}: {
  href: string;
  icon: string;
  title: string;
  value: string;
  external?: boolean;
}) {
  return (
    <a
      className="contact-method"
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <div className="contact-icon">
        <i className={icon} />
      </div>
      <div className="contact-info">
        <h3>{title}</h3>
        <p>{value}</p>
      </div>
    </a>
  );
}
