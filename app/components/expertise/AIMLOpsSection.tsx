

export default function AIMLOpsSection() {
	return (
		<section
			className="services-section section-tight-top"
			id="ai-mlops"
			aria-labelledby="ai-mlops-heading"
		>
			<h2 className="section-title" id="ai-mlops-heading">
				AI & MLOps infrastructure
			</h2>
			<p className="section-subtitle">
				Explicit support for leaders who need AI in production — not only demos
				— with security and cost under control.
			</p>
			<div className="services-grid ai-mlops-grid">
				<div className="service-card ai-mlops-wide-card">
					<ul className="service-bullets">
						<li>
							Design of secure AI infrastructure (LLMs, RAG, GPU-backed
							workloads).
						</li>
						<li>
							Integration with Azure OpenAI / OpenAI with cost, safety and
							access guardrails.
						</li>
						<li>
							Observability for AI workloads — logs, traces, prompt analytics
							where appropriate.
						</li>
						<li>
							Compliance-aware design (e.g. ISO 42001, data residency, access
							control) aligned with your policies.
						</li>
					</ul>
				</div>
			</div>
		</section>
	);
}
