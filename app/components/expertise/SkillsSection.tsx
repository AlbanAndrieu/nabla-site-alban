const SKILL_CATEGORIES = [
  {
    icon: "fas fa-shield",
    tags: [
      "Zero trust, WAF, hardening",
      "SAST, DAST, OWASP",
      "Vault, SIEM",
      "ISO 27001 / 42001, SOC 2",
    ],
  },
  {
    icon: "fas fa-chart-area",
    tags: ["Prometheus", "Grafana", "Loki", "OpenTelemetry"],
  },
  {
    icon: "fas fa-brain",
    tags: ["Azure OpenAI / GPU", "LangFuse, DVC", "FastAPI, MCP", "Temporal"],
  },
  { icon: "fas fa-cloud", tags: ["AWS", "Azure", "OVHcloud", "Cloudflare"] },
  {
    icon: "fas fa-cube",
    tags: ["Kubernetes", "Docker, Helm", "Nomad, Rancher"],
  },
  { icon: "fas fa-file-code", tags: ["Terraform", "Ansible", "Argo CD"] },
  { icon: "fas fa-code", tags: ["GitHub Actions", "GitLab CI", "Jenkins"] },
  {
    icon: "fas fa-database",
    tags: ["PostgreSQL", "Elasticsearch", "VictoriaMetrics"],
  },
  { icon: "fas fa-laptop-code", tags: ["Python", "Bash", "Java, C++"] },
] as const;

type Props = {
  title: string;
  subtitle: string;
  categoryTitles: string[];
  cvLink: string;
  cvHref: string;
};

export default function SkillsSection({
  title,
  subtitle,
  categoryTitles,
  cvLink,
  cvHref,
}: Props) {
  return (
    <section
      className="skills-section"
      id="skills"
      aria-labelledby="skills-heading"
    >
      <h2 className="section-title" id="skills-heading">
        {title}
      </h2>
      <p className="section-subtitle">{subtitle}</p>
      <div className="skills-container">
        <div className="skills-grid">
          {SKILL_CATEGORIES.map((category, index) => (
            <section className="skill-category" key={category.icon}>
              <h3 className="h4">
                <i className={category.icon} aria-hidden="true"></i>{" "}
                {categoryTitles[index]}
              </h3>
              <div className="skill-tags">
                {category.tags.map((tag) => (
                  <span className="skill-tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
      <p className="skills-more">
        <a href={cvHref}>{cvLink}</a>
      </p>
    </section>
  );
}
