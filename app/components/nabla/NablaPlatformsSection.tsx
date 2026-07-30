import type React from "react";

type Pillar = {
  title: string;
  icon: string;
  color: string;
  tools: { label: string; link?: string }[];
};

type Props = {
  heading: React.ReactNode;
  intro1: React.ReactNode;
  intro2?: React.ReactNode;
  logoSrc: string;
  logoAlt: string;
  logoCtaLabel: string;
  logoCtaHref: string;
  pillars: Pillar[];
};

export default function NablaPlatformsSection({
  heading,
  intro1,
  intro2,
  logoSrc,
  logoAlt,
  logoCtaLabel,
  logoCtaHref,
  pillars,
}: Props) {
  return (
    <section
      className="py-4 page-truenas-secondary"
      aria-labelledby="nabla-platforms-heading"
    >
      <div className="container">
        <h2 id="nabla-platforms-heading" className="h4 mb-3">
          <i
            className="fas fa-layer-group text-primary me-2"
            aria-hidden="true"
          ></i>
          {heading}
        </h2>
        <p className="text-secondary mb-4">{intro1}</p>
        {intro2 && <p>{intro2}</p>}
        {/* Horizontal responsive grid for pillars */}
        <div className="row mt-5 gx-3">
          {pillars.map((pillar) => (
            <div className="col-12 col-md-6 col-lg-4 mb-4" key={pillar.title}>
              <div className="card box-shadow h-100 border-0">
                <div className="card-body">
                  <h4
                    className="h6 card-title mb-2"
                    style={{ color: pillar.color }}
                  >
                    <i className={pillar.icon + " me-2"} aria-hidden="true"></i>
                    {pillar.title}
                  </h4>
                  <ul className="list-unstyled mb-0">
                    {pillar.tools.map((tool) =>
                      tool.link ? (
                        <li key={tool.label}>
                          <a
                            href={tool.link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {tool.label}
                          </a>
                        </li>
                      ) : (
                        <li key={tool.label}>{tool.label}</li>
                      ),
                    )}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
