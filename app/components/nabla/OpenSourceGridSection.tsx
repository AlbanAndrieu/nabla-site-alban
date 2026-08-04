import React from "react";

type OpenSourceCard = {
	icon: string;
	title: string;
	description: string;
	link?: { label: string; url: string; icon?: string };
};

type Props = {
	cards: OpenSourceCard[];
};

const OpenSourceGridSection = ({ cards }: Props) => (
	<section className="opensource-section" id="opensource">
		<h2 className="section-title">Open Source Contributions</h2>
		<p className="section-subtitle">
			Active contributor to the DevSecOps community
		</p>
		<div className="opensource-grid">
			{cards.map((card, i) => (
				<div className="opensource-card" key={card.title + i}>
					<div className="opensource-icon">
						<i className={card.icon}></i>
					</div>
					<h3>{card.title}</h3>
					<p>{card.description}</p>
					{card.link && (
						<a
							href={card.link.url}
							target="_blank"
							rel="noopener noreferrer"
							className="opensource-link"
						>
							{card.link.label}rochains travaux doivent consister à migrer
							progressivement chaque bloc du HTML legacy en React, en
							{card.link.icon && <i className={card.link.icon}></i>}
						</a>
					)}
				</div>
			))}
		</div>
		<p className="tools-grid-heading mb-0">
			<a href="/link.html">Profiles & registries in use</a>
			<span className="text-muted"> — GitHub, SonarCloud, Docker Hub, </span>
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
);

export default OpenSourceGridSection;
