import React from "react";

type Props = {
  title: string;
  description: string;
  linkLabel: string;
  linkUrl: string;
};

export default function DockerHeroCard({
  title,
  description,
  linkLabel,
  linkUrl,
}: Props) {
  return (
    <div className="d-flex justify-content-center align-items-center mb-5">
      <div
        className="card shadow border-0"
        style={{ maxWidth: 400, minWidth: 320 }}
      >
        <div className="text-center pt-4 pb-2">
          <span style={{ fontSize: 48, color: "#2496ed" }}>
            <i className="fab fa-docker" aria-hidden="true"></i>
          </span>
          <span
            className="badge ms-2 bg-info text-dark"
            style={{ verticalAlign: "top", fontSize: 16 }}
          >
            open source
          </span>
        </div>
        <div className="card-body text-center">
          <h3 className="h5">{title}</h3>
          <p className="card-text text-muted mb-3">{description}</p>
          <a
            href={linkUrl}
            className="btn btn-outline-info"
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="fab fa-docker me-2"></i>
            {linkLabel}
          </a>
        </div>
      </div>
    </div>
  );
}
