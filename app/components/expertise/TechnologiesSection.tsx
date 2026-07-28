import Image from "next/image";

import {
	TECHNOLOGY_GROUPS,
	type TechnologyGroup,
} from "../../../lib/technologyCatalog";

function LogoRow({ title, technologies }: TechnologyGroup) {
	return (
		<div style={{ marginBottom: 28 }}>
			<h3 style={{ fontWeight: 700, margin: "0 0 8px" }}>{title}</h3>
			<ul
				className="skill-tags"
				style={{ display: "flex", flexWrap: "wrap", gap: 8, listStyle: "none", padding: 0 }}
			>
				{technologies.map(({ name, href, icon }) => (
					<li key={name}>
						<a
							href={href}
							target="_blank"
							rel="noopener noreferrer"
							aria-label={`${name} — official website (opens in a new tab)`}
							title={name}
						>
							{icon ? (
								<Image
									src={icon}
									alt=""
									width={42}
									height={42}
									style={{ height: "auto" }}
								/>
							) : (
								<span
									aria-hidden="true"
									style={{
										display: "grid",
										placeItems: "center",
										width: 42,
										height: 42,
										fontWeight: 700,
									}}
								>
									{name}
								</span>
							)}
						</a>
					</li>
				))}
			</ul>
		</div>
	);
}

export default function TechnologiesSection() {
	return (
		<section
			className="services-section section-tight-top"
			id="ai-stack"
			aria-labelledby="ai-stack-heading"
		>
			<h2 className="section-title" id="ai-stack-heading">
				Technologies & Stack
			</h2>
			<p className="section-subtitle">
				Here is a selection of technologies I use in production.
			</p>
			<div className="services-grid ai-mlops-grid">
				<div className="service-card ai-mlops-wide-card">
					{TECHNOLOGY_GROUPS.map((group) => (
						<LogoRow key={group.title} {...group} />
					))}
				</div>
			</div>
		</section>
	);
}
