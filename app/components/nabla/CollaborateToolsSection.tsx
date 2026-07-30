import Image from "next/image";
import type React from "react";

type Tool = {
  label: string;
  icon?: string;
  imageSrc?: string;
  imageAlt?: string;
  badge?: string;
  color?: string;
  link?: string;
};

type Props = {
  heading: React.ReactNode;
  subtitle?: React.ReactNode;
  tools: Tool[];
};

export default function CollaborateToolsSection({
  heading,
  subtitle,
  tools,
}: Props) {
  return (
    <section className="py-3" aria-labelledby="collaborate-tools-heading">
      <div className="container">
        <h2 id="collaborate-tools-heading" className="h4 mb-3">
          <i className="fas fa-users text-primary me-2" aria-hidden="true"></i>
          {heading}
        </h2>
        {subtitle && <p className="mb-4 text-secondary">{subtitle}</p>}
        <div className="row g-3 justify-content-center">
          {tools.map((tool) => (
            <div className="col-auto" key={tool.label}>
              <div className="card shadow-sm border-0 p-3 d-flex flex-row align-items-center">
                <span
                  style={{
                    fontSize: 32,
                    color: tool.color || "#333",
                    minHeight: 38,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {tool.imageSrc ? (
                    <Image
                      src={tool.imageSrc}
                      alt={tool.imageAlt || tool.label + " logo"}
                      width={32}
                      height={32}
                      style={{
                        display: "block",
                        marginLeft: "auto",
                        marginRight: "auto",
                        objectFit: "contain",
                        width: 32,
                        height: 32,
                      }}
                    />
                  ) : (
                    tool.icon && (
                      <i className={tool.icon} aria-hidden="true"></i>
                    )
                  )}
                </span>
                <span className="ms-3 fw-semibold">
                  {tool.link ? (
                    <a
                      href={tool.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {tool.label}
                    </a>
                  ) : (
                    tool.label
                  )}
                  {tool.badge && (
                    <span
                      className="badge ms-2 bg-info text-dark"
                      style={{ fontSize: 12 }}
                    >
                      {tool.badge}
                    </span>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
