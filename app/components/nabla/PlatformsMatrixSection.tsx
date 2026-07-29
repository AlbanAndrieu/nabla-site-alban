import React from "react";

/**
 * Data/shape:
 * props.pillars is an array of { title, icon, color, tools: [{label, link?}] }
 * This can be injected from the page—so content/structure stays DRY and testable.
 */
type NablaPillar = {
	title: string;
	icon: string;
	color: string;
	tools: { label: string; link?: string }[];
};

type PlatformsMatrixSectionProps = {
	pillars: NablaPillar[];
};

const PlatformsMatrixSection = ({ pillars }: PlatformsMatrixSectionProps) => (
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
				<span className="nabla-platforms-orbit" aria-hidden="true"></span>
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
						A representative DevSecOps toolchain: plan, build, ship, run,
						harden, and observe—including security as a first class citizen.
					</figcaption>
				</figure>
			</div>
			<div className="nabla-platforms-lede">
				<h3>From collaborate to secure delivery</h3>
				<p>
					Illustrative map of common tools across delivery and operations—not
					exhaustive. Your stack should match risk, compliance, and team skills.
				</p>
				<p>
					This home lab has been built to host the coming Nabla company projects
					and services. Goal is to test integration of Security and AI services
					and experiences attacks performed on my domains.
				</p>
			</div>
		</div>
		<div className="nabla-platforms-matrix">
			{pillars.map((pillar) => (
				<div
					key={pillar.title}
					className="nabla-platform-pillar"
					style={{ ["--pillar-accent" as any]: pillar.color }}
				>
					<h3>
						<i className={pillar.icon} aria-hidden="true"></i> {pillar.title}
					</h3>
					<ul className="nabla-tool-tags">
						{pillar.tools.map((tool, i) =>
							tool.link ? (
								<li key={tool.label + i} className="nabla-tool-tag-li-link">
									<a
										href={tool.link}
										target="_blank"
										rel="noopener noreferrer"
										className="nabla-tool-tag-link"
									>
										{tool.label}
									</a>
								</li>
							) : (
								<li key={tool.label + i}>{tool.label}</li>
							),
						)}
					</ul>
				</div>
			))}
		</div>
	</section>
);

export default PlatformsMatrixSection;
