import type React from "react";

type ServiceCardLink = { label: string; url: string; icon?: string };
type ServiceCard = {
	icon: string;
	title: string;
	description: string;
	links?: ServiceCardLink[];
	customContent?: React.ReactNode;
};

type Props = {
	services: ServiceCard[];
};

const ServiceCardsSection = ({ services }: Props) => (
	<section className="category-section" id="services">
		<h2 className="section-title">
			<i className="fas fa-robot"></i> Tools & Automation
		</h2>
		<p className="section-subtitle">
			Comprehensive DevSecOps solutions tailored to your security checks needs
		</p>
		<div className="services-grid">
			{services.map((service, i) => (
				<div className="service-card" key={service.title + i}>
					<div className="service-icon">
						<i className={service.icon}></i>
					</div>
					<h3>{service.title}</h3>
					<p>{service.description}</p>
					{service.customContent}
					{service.links?.map((link) => (
						<a
							key={link.label}
							href={link.url}
							target="_blank"
							rel="noopener noreferrer"
							className="opensource-link d-block"
						>
							{link.label} {link.icon && <i className={link.icon}></i>}
						</a>
					))}
				</div>
			))}
		</div>
	</section>
);

export default ServiceCardsSection;
