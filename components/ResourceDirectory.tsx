import type { ResourceSection } from "@/lib/resourcePages";

type Translator = (key: string) => string;

export default function ResourceDirectory({
  sections,
  t,
}: {
  sections: ResourceSection[];
  t: Translator;
}) {
  return (
    <div className="services-grid">
      {sections.map((section) => (
        <article className="service-card" key={section.key}>
          <div className="service-icon" aria-hidden="true">
            <i className={`fas ${section.icon}`} />
          </div>
          <h2>{t(`sections.${section.key}.title`)}</h2>
          <p className="service-lead">
            {t(`sections.${section.key}.description`)}
          </p>
          <ul className="resource-list">
            {section.links.map((link) => (
              <li key={link.href}>
                <a href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
