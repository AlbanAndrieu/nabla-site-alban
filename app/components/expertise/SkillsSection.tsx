export default function SkillsSection() {
	return (
		<section
			className="skills-section"
			id="skills"
			aria-labelledby="skills-heading"
		>
			<h2 className="section-title" id="skills-heading">
				Technical expertise
			</h2>
			<p className="section-subtitle">
				High-signal stack for cloud, DevSecOps, security and AI — full detail in
				the CV and on request.
			</p>
			<div className="skills-container">
				<div className="skills-grid">
					<div className="skill-category">
						<h4>
							<i className="fas fa-shield"></i> Security & compliance
						</h4>
						<div className="skill-tags">
							<span className="skill-tag">Zero trust, WAF, hardening</span>
							<span className="skill-tag">SAST, DAST, OWASP</span>
							<span className="skill-tag">Vault, SIEM-class tooling</span>
							<span className="skill-tag">ISO 27001 / 42001, SOC 2</span>
						</div>
					</div>
					<div className="skill-category">
						<h4>
							<i className="fas fa-chart-area"></i> Monitoring & logging
						</h4>
						<div className="skill-tags">
							<span className="skill-tag">Prometheus</span>
							<span className="skill-tag">Grafana</span>
							<span className="skill-tag">Loki</span>
							<span className="skill-tag">OpenTelemetry</span>
						</div>
					</div>
					<div className="skill-category">
						<h4>
							<i className="fas fa-brain"></i> AI & data processing
						</h4>
						<div className="skill-tags">
							<span className="skill-tag">Azure OpenAI / GPUs</span>
							<span className="skill-tag">LangFuse, DVC</span>
							<span className="skill-tag">FastAPI, MCP</span>
							<span className="skill-tag">Temporal</span>
						</div>
					</div>
					<div className="skill-category">
						<h4>
							<i className="fas fa-cloud"></i> Cloud platforms
						</h4>
						<div className="skill-tags">
							<span className="skill-tag">AWS</span>
							<span className="skill-tag">Azure</span>
							<span className="skill-tag">OVHcloud</span>
							<span className="skill-tag">Cloudflare</span>
						</div>
					</div>
					<div className="skill-category">
						<h4>
							<i className="fas fa-cube"></i> Containers & orchestration
						</h4>
						<div className="skill-tags">
							<span className="skill-tag">Kubernetes</span>
							<span className="skill-tag">Docker, Helm</span>
							<span className="skill-tag">Nomad, Rancher</span>
						</div>
					</div>
					<div className="skill-category">
						<h4>
							<i className="fas fa-file-code"></i> Infrastructure as Code
						</h4>
						<div className="skill-tags">
							<span className="skill-tag">Terraform</span>
							<span className="skill-tag">Ansible</span>
							<span className="skill-tag">Argo CD</span>
						</div>
					</div>
					<div className="skill-category">
						<h4>
							<i className="fas fa-code"></i> DevOps & SDLC
						</h4>
						<div className="skill-tags">
							<span className="skill-tag">GitHub Actions</span>
							<span className="skill-tag">GitLab CI</span>
							<span className="skill-tag">Jenkins</span>
						</div>
					</div>
					<div className="skill-category">
						<h4>
							<i className="fas fa-database"></i> Data stores
						</h4>
						<div className="skill-tags">
							<span className="skill-tag">PostgreSQL</span>
							<span className="skill-tag">Elasticsearch</span>
							<span className="skill-tag">VictoriaMetrics</span>
						</div>
					</div>
					<div className="skill-category">
						<h4>
							<i className="fas fa-laptop-code"></i> Programming
						</h4>
						<div className="skill-tags">
							<span className="skill-tag">Python</span>
							<span className="skill-tag">Bash</span>
							<span className="skill-tag">Java, C++</span>
						</div>
					</div>
				</div>
			</div>
			<p className="skills-more">
				<a href="/cv/index.html" target="_blank" rel="noopener noreferrer">
					View full CVs & formats
				</a>
			</p>
		</section>
	);
}
