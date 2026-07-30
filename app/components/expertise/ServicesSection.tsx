export type ExpertiseService = {
  title: string;
  lead: string;
  bullets: string[];
};

const SERVICE_PRESENTATION = [
  ["security-integration", "fas fa-shield-halved"],
  ["ai-integration", "fas fa-brain"],
  ["cloud-architecture", "fas fa-cloud"],
  ["devops-transformation", "fas fa-infinity"],
  ["iac", "fas fa-robot"],
  ["container-orchestration", "fas fa-diagram-project"],
  ["monitoring-observability", "fas fa-chart-line"],
] as const;

type Props = { title: string; subtitle: string; services: ExpertiseService[] };

export default function ServicesSection({ title, subtitle, services }: Props) {
  return (
    <section
      className="services-section"
      id="services"
      aria-labelledby="services-heading"
    >
      <h2 className="section-title" id="services-heading">
        {title}
      </h2>
      <p className="section-subtitle">{subtitle}</p>
      <div className="services-grid">
        {services.map((service, index) => {
          const [id, icon] = SERVICE_PRESENTATION[index];
          return (
            <article className="service-card" id={id} key={id}>
              <div className="service-icon" aria-hidden="true">
                <i className={icon}></i>
              </div>
              <h3>{service.title}</h3>
              <p className="service-lead">{service.lead}</p>
              <ul className="service-bullets">
                {service.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}
