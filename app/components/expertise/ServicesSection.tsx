export default function ServicesSection() {
	return (
		<section
			className="services-section"
			id="services"
			aria-labelledby="services-heading"
		>
			<h2 className="section-title" id="services-heading">
				Services I Offer
			</h2>
			<p className="section-subtitle">
				Practical DevSecOps and cloud work for leadership teams — recent
				outcomes on AWS, Azure and OVH.
			</p>
			<div className="services-grid">
				{[
					{
						icon: "fas fa-shield-halved",
						id: "security-integration",
						title: "Security integration",
						lead: "Make security part of development — not a late surprise before release.",
						bullets: [
							"Automated security scans in CI/CD (SAST/DAST, dependency checks).",
							"Vulnerability management for cloud and applications.",
							"Support for ISO 27001 / SOC 2 readiness and audits.",
						],
					},
					{
						icon: "fas fa-brain",
						id: "ai-integration",
						title: "AI integration",
						lead: "Turn LLMs into production-grade assistants — safely and cost-aware.",
						bullets: [
							"Design of AI-assisted workflows (support, internal tools, ops).",
							"Integration with OpenAI / Azure OpenAI and custom or hosted models.",
							"Cost control and observability (e.g. LangFuse, tracing, guardrails).",
						],
					},
					{
						icon: "fas fa-cloud",
						id: "cloud-architecture",
						title: "Cloud architecture",
						lead: "Scalable, cost-efficient and secure landings on AWS, Azure or OVHcloud.",
						bullets: [
							"Multi-account design, networking and hardening.",
							"Cost optimization, monitoring and operational clarity.",
							"High availability, backup and disaster-recovery patterns.",
						],
					},
					{
						icon: "fas fa-infinity",
						id: "devops-transformation",
						title: "DevOps transformation",
						lead: "Faster, repeatable delivery without burning out the team.",
						bullets: [
							"End-to-end SDLC pipelines and release automation.",
							"Process and tooling choices aligned with your risk profile.",
							"Hands-on enablement so your engineers own the stack.",
						],
					},
					{
						icon: "fas fa-robot",
						id: "iac",
						title: "Infrastructure as Code",
						lead: "One source of truth for infrastructure — reviewable and reproducible.",
						bullets: [
							"Terraform, Ansible and GitOps (e.g. Argo CD) for consistent environments.",
							"Patterns for staging, production and multi-region setups.",
						],
					},
					{
						icon: "fas fa-diagram-project",
						id: "container-orchestration",
						title: "Container orchestration",
						lead: "Run workloads portably from laptop to production clusters.",
						bullets: [
							"Kubernetes, Nomad, Docker; ingress, secrets and platform basics.",
							"Edge and platform glue (e.g. Cloudflare, Vault) where it reduces risk.",
						],
					},
					{
						icon: "fas fa-chart-line",
						id: "monitoring-observability",
						title: "Monitoring & observability",
						lead: "Know when something breaks before your customers do.",
						bullets: [
							"Metrics, logs and traces (Prometheus, Grafana, Loki, OpenTelemetry, ELK-class stacks).",
							"Dashboards and alerting tuned to SLOs and on-call reality.",
						],
					},
				].map((s) => (
					<div className="service-card" key={s.id}>
						<div className="service-icon">
							<i className={s.icon}></i>
						</div>
						<h3>{s.title}</h3>
						<p className="service-lead">{s.lead}</p>
						<ul className="service-bullets">
							{s.bullets.map((b) => (
								<li key={s.id + b}>{b}</li>
							))}
						</ul>
					</div>
				))}
			</div>
		</section>
	);
}
