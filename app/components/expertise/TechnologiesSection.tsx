import Image from "next/image";

import {
  TECHNOLOGY_GROUPS,
  type TechnologyGroup,
} from "../../../lib/technologyCatalog";

function LogoRow({
  title,
  technologies,
  officialWebsite,
}: TechnologyGroup & { officialWebsite: string }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ fontWeight: 700, margin: "0 0 8px" }}>{title}</h3>
      <ul
        className="skill-tags"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          listStyle: "none",
          padding: 0,
        }}
      >
        {technologies.map(({ name, href, icon }) => (
          <li key={name}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${name} — ${officialWebsite}`}
              title={name}
            >
              {icon ? (
                <Image
                  src={icon}
                  alt=""
                  width={42}
                  height={42}
                  style={{ height: "auto" }}
                />
              ) : (
                <span
                  aria-hidden="true"
                  style={{
                    display: "grid",
                    placeItems: "center",
                    width: 42,
                    height: 42,
                    fontWeight: 700,
                  }}
                >
                  {name}
                </span>
              )}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

type Props = {
  title: string;
  subtitle: string;
  groupTitles: string[];
  officialWebsite: string;
};

export default function TechnologiesSection({
  title,
  subtitle,
  groupTitles,
  officialWebsite,
}: Props) {
  return (
    <section
      className="services-section section-tight-top"
      id="ai-stack"
      aria-labelledby="ai-stack-heading"
    >
      <h2 className="section-title" id="ai-stack-heading">
        {title}
      </h2>
      <p className="section-subtitle">{subtitle}</p>
      <div className="services-grid ai-mlops-grid">
        <div className="service-card ai-mlops-wide-card">
          {TECHNOLOGY_GROUPS.map((group, index) => (
            <LogoRow
              key={group.title}
              {...group}
              title={groupTitles[index]}
              officialWebsite={officialWebsite}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
