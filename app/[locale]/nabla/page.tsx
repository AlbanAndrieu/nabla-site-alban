import { getTranslations } from "next-intl/server";
import type React from "react";
import TopAnchor from "@/components/TopAnchor";

export default async function NablaPage() {
	const site = await getTranslations("site");
	return (
		<div className="site-content-page page-dark page-nabla-best-practices">
			<TopAnchor />
			<a href="#main-content" className="skip-to-main">
				{site("skipToMainContent")}
			</a>
			{/* Breadcrumb/nav will go here */}
			{/* Hero section will go here */}
			<main id="main-content" role="main" className="mb-5">
				{/* Toolchain Platforms & Matrix */}
				<section
					className="content-section"
					aria-labelledby="nabla-platforms-heading"
				>
					<section
						className="category-section nabla-platforms-section"
						aria-labelledby="nabla-platforms-heading"
					>
						<h2 id="nabla-platforms-heading" className="category-title">
							<i className="fas fa-layer-group" aria-hidden="true"></i> Popular
							DevSecOps Platforms & Tools
						</h2>
						<div className="nabla-platforms-hero">
							<div className="nabla-platforms-visual-wrap">
								<span
									className="nabla-platforms-orbit"
									aria-hidden="true"
								></span>
								<figure className="nabla-platforms-figure">
									<img
										src="/assets/nabla/nabla-4.svg"
										width={200}
										height={200}
										alt="Nabla site logo"
										loading="lazy"
										decoding="async"
									/>
									<figcaption className="nabla-platforms-caption">
										A representative DevSecOps toolchain: plan, build, ship,
										run, harden, and observe— including security as a first
										class citizen.
									</figcaption>
								</figure>
							</div>
							<div className="nabla-platforms-lede">
								<h3>From collaborate to secure delivery</h3>
								<p>
									Illustrative map of common tools across delivery and
									operations—not exhaustive. Your stack should match risk,
									compliance, and team skills.
								</p>
								<p>
									This home lab has been build to host the coming Nabla company
									projects and services. Goal is to test integration of Security
									and AI services and experiences attacks performed on my
									domains.
								</p>
							</div>
						</div>

						<div className="nabla-platforms-matrix">
							{/* Collaborate Pillar */}
							<div
								className="nabla-platform-pillar"
								style={{ "--pillar-accent": "#0d6efd" } as React.CSSProperties}
							>
								<h3>
									<i className="fas fa-users" aria-hidden="true"></i>{" "}
									Collaborate
								</h3>
								<ul className="nabla-tool-tags">
									<li>Git</li>
									<li>
										<a
											href="https://github.com/AlbanAndrieu"
											target="_blank"
											rel="noopener noreferrer"
											className="nabla-tool-tag-link"
											title="Alban Andrieu on GitHub"
										>
											GitHub
										</a>
									</li>
									<li>
										<a
											href="https://gitlab.com/AlbanAndrieu"
											target="_blank"
											rel="noopener noreferrer"
											className="nabla-tool-tag-link"
											title="Alban Andrieu on GitLab"
										>
											GitLab
										</a>
									</li>
									<li>Jira</li>
									<li>Asana</li>
									<li>Slack</li>
									<li>
										<a
											href="https://reactive-resume.albandrieu.com"
											target="_blank"
											rel="noopener noreferrer"
											className="nabla-tool-tag-link"
											title="Homelab Reactive Resume — tunnel origin :3007"
										>
											Reactive Resume
										</a>
									</li>
								</ul>
							</div>
							{/* Build Pillar */}
							<div
								className="nabla-platform-pillar"
								style={{ "--pillar-accent": "#6f42c1" } as React.CSSProperties}
							>
								<h3>
									<i className="fas fa-cubes" aria-hidden="true"></i> Build
								</h3>
								<ul className="nabla-tool-tags">
									<li>Docker</li>
									<li>Maven</li>
									<li>Npm</li>
									<li>UV</li>
									<li>Harbor</li>
									<li>
										<a
											href="https://nexus.albandrieu.com"
											target="_blank"
											rel="noopener noreferrer"
											className="nabla-tool-tag-link"
											title="Homelab Nexus — tunnel origin :8081"
										>
											Nexus
										</a>
									</li>
									<li>
										<a
											href="https://stirling-albandrieu.albandrieu.com"
											target="_blank"
											rel="noopener noreferrer"
											className="nabla-tool-tag-link"
											title="Homelab Stirling PDF"
										>
											Stirling PDF
										</a>
									</li>
								</ul>
							</div>
							{/* Integrate & Deliver Pillar */}
							<div
								className="nabla-platform-pillar"
								style={{ "--pillar-accent": "#0dcaf0" } as React.CSSProperties}
							>
								<h3>
									<i className="fas fa-code-branch" aria-hidden="true"></i>{" "}
									Integrate & deliver
								</h3>
								<ul className="nabla-tool-tags">
									<li>
										<a
											href="https://jenkins.albandrieu.com"
											target="_blank"
											rel="noopener noreferrer"
											className="nabla-tool-tag-link"
											title="Homelab Jenkins"
										>
											Jenkins
										</a>
									</li>
									<li>GitHub Actions</li>
									<li>
										<a
											href="https://gitlab.com/AlbanAndrieu"
											target="_blank"
											rel="noopener noreferrer"
											className="nabla-tool-tag-link"
											title="Alban Andrieu on GitLab"
										>
											GitLab
										</a>
									</li>
									<li>Argo CD</li>
									<li>Helm</li>
									<li>
										<a
											href="https://portracker.albandrieu.com"
											target="_blank"
											rel="noopener noreferrer"
											className="nabla-tool-tag-link"
											title="Homelab Portracker"
										>
											Portracker
										</a>
									</li>
								</ul>
							</div>
							{/* Cloud & Runtime Pillar */}
							<div
								className="nabla-platform-pillar"
								style={{ "--pillar-accent": "#198754" } as React.CSSProperties}
							>
								<h3>
									<i className="fas fa-server" aria-hidden="true"></i> Cloud &
									runtime
								</h3>
								<ul className="nabla-tool-tags">
									<li>Kubernetes</li>
									<li>EKS</li>
									<li>AKS</li>
									<li>Rancher</li>
									<li>
										<a
											href="https://nomad.albandrieu.com"
											target="_blank"
											rel="noopener noreferrer"
											className="nabla-tool-tag-link"
											title="Homelab Nomad UI"
										>
											Nomad
										</a>
									</li>
									<li>AWS</li>
									<li>Azure</li>
									<li>
										<a
											href="https://famp.albandrieu.com"
											target="_blank"
											rel="noopener noreferrer"
											className="nabla-tool-tag-link"
											title="Homelab FAMP"
										>
											FAMP
										</a>
									</li>
									<li>
										<a
											href="https://localai.albandrieu.com"
											target="_blank"
											rel="noopener noreferrer"
											className="nabla-tool-tag-link"
											title="Homelab LocalAI"
										>
											LocalAI
										</a>
									</li>
									<li>
										<a
											href="https://ollama.albandrieu.com"
											target="_blank"
											rel="noopener noreferrer"
											className="nabla-tool-tag-link"
											title="Homelab Ollama"
										>
											Ollama
										</a>
									</li>
									<li>
										<a
											href="https://anythingllm.albandrieu.com"
											target="_blank"
											rel="noopener noreferrer"
											className="nabla-tool-tag-link"
											title="Homelab AnythingLLM"
										>
											AnythingLLM
										</a>
									</li>
								</ul>
							</div>
							{/* Automate Pillar */}
							<div
								className="nabla-platform-pillar"
								style={{ "--pillar-accent": "#fd7e14" } as React.CSSProperties}
							>
								<h3>
									<i className="fas fa-gears" aria-hidden="true"></i> Automate
								</h3>
								<ul className="nabla-tool-tags">
									<li>Terraform</li>
									<li>Ansible</li>
									<li>OpenPolicyAgent</li>
									<li>
										<a
											href="https://openclaw.albandrieu.com"
											target="_blank"
											rel="noopener noreferrer"
											className="nabla-tool-tag-link"
											title="Homelab OpenClaw"
										>
											OpenClaw
										</a>
									</li>
									<li>
										<a
											href="https://litellm.albandrieu.com"
											target="_blank"
											rel="noopener noreferrer"
											className="nabla-tool-tag-link"
											title="Homelab LiteLLM"
										>
											LiteLLM
										</a>
									</li>
									<li>
										<a
											href="https://plumber.albandrieu.com"
											target="_blank"
											rel="noopener noreferrer"
											className="nabla-tool-tag-link"
											title="Homelab Plumber"
										>
											Plumber
										</a>
									</li>
									<li>
										<a
											href="https://plumber-api.albandrieu.com"
											target="_blank"
											rel="noopener noreferrer"
											className="nabla-tool-tag-link"
											title="Homelab Plumber API"
										>
											Plumber API
										</a>
									</li>
								</ul>
							</div>
							{/* Secure & Observe Pillar */}
							<div
								className="nabla-platform-pillar"
								style={{ "--pillar-accent": "#d63384" } as React.CSSProperties}
							>
								<h3>
									<i className="fas fa-shield-halved" aria-hidden="true"></i>{" "}
									Secure & observe
								</h3>
								<ul className="nabla-tool-tags">
									<li>SonarQube</li>
									<li>Snyk</li>
									<li>Trivy</li>
									<li>
										<a
											href="https://vault.albandrieu.com"
											target="_blank"
											rel="noopener noreferrer"
											className="nabla-tool-tag-link"
											title="Homelab Vault UI"
										>
											Vault
										</a>
									</li>
									<li>
										<a
											href="https://prometheus.albandrieu.com"
											target="_blank"
											rel="noopener noreferrer"
											className="nabla-tool-tag-link"
											title="Homelab Prometheus"
										>
											Prometheus
										</a>
									</li>
									<li>
										<a
											href="https://grafana.albandrieu.com"
											target="_blank"
											rel="noopener noreferrer"
											className="nabla-tool-tag-link"
											title="Homelab Grafana"
										>
											Grafana
										</a>
									</li>
									<li>OpenTelemetry</li>
									<li>Wazuh</li>
									<li>Suricata</li>
									<li>Falco</li>
									<li>ELK</li>
									<li>Datadog</li>
									<li>
										<a
											href="https://172.17.0.1:10443/#"
											target="_blank"
											rel="noopener noreferrer"
											className="nabla-tool-tag-link"
											title="pfSense web UI"
										>
											pfSense
										</a>
									</li>
									<li>
										<a
											href="https://honeypot.albandrieu.com"
											target="_blank"
											rel="noopener noreferrer"
											className="nabla-tool-tag-link"
											title="Homelab honeypot"
										>
											Honeypot
										</a>
									</li>
									<li>
										<a
											href="https://graylog.albandrieu.com"
											target="_blank"
											rel="noopener noreferrer"
											className="nabla-tool-tag-link"
											title="Homelab Graylog"
										>
											Graylog
										</a>
									</li>
									<li>
										<a
											href="https://netalertx.albandrieu.com"
											target="_blank"
											rel="noopener noreferrer"
											className="nabla-tool-tag-link"
											title="Homelab NetAlertX"
										>
											NetAlertX
										</a>
									</li>
									<li>
										<a
											href="https://ntopng.albandrieu.com"
											target="_blank"
											rel="noopener noreferrer"
											className="nabla-tool-tag-link"
											title="Homelab ntopng"
										>
											ntopng
										</a>
									</li>
									<li>
										<a
											href="https://vaultwarden.albandrieu.com"
											target="_blank"
											rel="noopener noreferrer"
											className="nabla-tool-tag-link"
											title="Homelab Vaultwarden"
										>
											Vaultwarden
										</a>
									</li>
								</ul>
							</div>
						</div>
					</section>
				</section>

				{/* Open Source */}
				<section className="opensource-section" id="opensource">
					<h2 className="section-title">Open Source Contributions</h2>
					<p className="section-subtitle">
						Active contributor to the DevSecOps community
					</p>
					<div className="opensource-grid">
						<div className="opensource-card">
							<div className="opensource-icon">
								<i className="fab fa-github"></i>
							</div>
							<h3>Ansible Roles & Playbooks</h3>
							<p>
								Extensive collection of Ansible automation including roles for
								Jenkins, Docker, Eclipse, and complete development environment
								setup. Used by teams worldwide.
							</p>
							<a
								href="https://github.com/AlbanAndrieu"
								target="_blank"
								rel="noopener noreferrer"
								className="opensource-link"
							>
								View on GitHub <i className="fas fa-external-link-alt"></i>
							</a>
						</div>
						<div className="opensource-card">
							<div className="opensource-icon">
								<i className="fas fa-code"></i>
							</div>
							<h3>Nabla DevSecOps Platform</h3>
							<p>
								Comprehensive DevSecOps platform combining SDLC, security
								scanning, infrastructure automation, and monitoring tools in a
								unified solution.
							</p>
							<a href="#home" className="opensource-link">
								Learn More{" "}
								<i className="fas fa-arrow-up" aria-hidden="true"></i>
							</a>
						</div>
						<div className="opensource-card">
							<div className="opensource-icon">
								<i className="fab fa-docker"></i>
							</div>
							<h3>Docker Images</h3>
							<p>
								Optimized and security-hardened Docker images for development
								and production environments, available on Docker Hub.
							</p>
							<a
								href="https://hub.docker.com/u/nabla"
								target="_blank"
								rel="noopener noreferrer"
								className="opensource-link"
							>
								View on Docker Hub <i className="fas fa-external-link-alt"></i>
							</a>
						</div>
					</div>
					<p className="tools-grid-heading mb-0">
						<a href="/link.html">Profiles & registries in use</a>
						<span className="text-muted">
							{" "}
							— GitHub, SonarCloud, Docker Hub,{" "}
						</span>
						<a
							href="https://nexus.albandrieu.com"
							target="_blank"
							rel="noopener noreferrer"
							className="text-muted"
							title="Homelab Nexus — tunnel origin :8081"
						>
							Nexus
						</a>
					</p>
				</section>
				{/* Services/Automation */}
				<section className="category-section" id="services">
					<h2 className="section-title">
						<i className="fas fa-robot"></i> Tools & Automation
					</h2>
					<p className="section-subtitle">
						Comprehensive DevSecOps solutions tailored to your security checks
						needs
					</p>
					<div className="services-grid">
						<div className="service-card">
							<div className="service-icon">
								<i className="fas fa-infinity"></i>
							</div>
							<h3>Optimized custom search</h3>
							<p>Custom search used by home made IA.</p>
							{/* Google Custom Search widget placeholder; script will be loaded client-side */}
							<div className="gcse-search"></div>
						</div>
						<div className="service-card">
							<div className="service-icon">
								<i className="fas fa-robot"></i>
							</div>
							<h3>Infrastructure as Code</h3>
							<div
								className="nabla-wip-callout"
								role="status"
								aria-live="polite"
							>
								<span className="nabla-wip-callout__icon" aria-hidden="true">
									<i className="fas fa-screwdriver-wrench"></i>
								</span>
								<div>
									<strong>Under construction</strong>
									This blurb is still in a feature branch: the full story is not
									merged yet and not quite ready for production traffic. Watch
									this space after the next rollout.
								</div>
							</div>
							<p>
								Implementing IaC solutions using Terraform, Ansible, and other
								tools to manage infrastructure efficiently and consistently.
							</p>
						</div>
						<div className="service-card">
							<div className="service-icon">
								<i className="fas fa-cloud" aria-hidden="true"></i>
							</div>
							<h3>FastAPI Cloud sample</h3>
							<p>
								A custom sample used to test CI, security access from outside my
								network and deployment with a personal MCP aimed to access my
								personal information.
							</p>
							<a
								href="https://fastapi-sample.fastapicloud.dev/api"
								target="_blank"
								rel="noopener noreferrer"
								className="opensource-link d-block"
							>
								Open sample{" "}
								<i className="fas fa-external-link-alt" aria-hidden="true"></i>
							</a>
							<a
								href="https://dashboard.fastapicloud.com/albanandrieu-22237405/apps"
								target="_blank"
								rel="noopener noreferrer"
								className="opensource-link d-block"
							>
								Admin UI{" "}
								<i className="fas fa-external-link-alt" aria-hidden="true"></i>
							</a>
							<a
								href="https://gitlab.com/AlbanAndrieu/fastapi-sample"
								target="_blank"
								rel="noopener noreferrer"
								className="opensource-link d-block mt-2"
							>
								View source on GitLab{" "}
								<i className="fab fa-gitlab" aria-hidden="true"></i>
							</a>
						</div>
					</div>
				</section>
				{/* Contact */}
			</main>
			{/* Footer will go here */}
			{/* Widget/script tags to be added as needed */}
		</div>
	);
}
