type Props = { title: string; subtitle: string; bullets: string[] };

export default function AIMLOpsSection({ title, subtitle, bullets }: Props) {
	return (
		<section className="services-section section-tight-top" id="ai-mlops" aria-labelledby="ai-mlops-heading">
			<h2 className="section-title" id="ai-mlops-heading">{title}</h2>
			<p className="section-subtitle">{subtitle}</p>
			<div className="services-grid ai-mlops-grid">
				<div className="service-card ai-mlops-wide-card">
					<ul className="service-bullets">
						{bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
					</ul>
				</div>
			</div>
		</section>
	);
}
