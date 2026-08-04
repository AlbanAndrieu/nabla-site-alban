import Image from "next/image";

type ContactCard = {
	icon: string;
	label: string;
	value: string;
	href: string;
	ariaLabel?: string;
};

type Props = {
	contacts: ContactCard[];
	logoSrc?: string;
};

export default function ContactSection({ contacts, logoSrc }: Props) {
	return (
		<section className="contact-section" id="contact">
			<div className="contact-container">
				<h2 className="section-title">Let's Work Together</h2>
				<p className="section-subtitle">
					Ready to transform your DevOps practices? Get in touch to discuss your
					project.
				</p>

				<div className="contact-methods">
					{contacts.map((c) => (
						<a
							href={c.href}
							key={c.value}
							className="contact-method"
							target={c.href.startsWith("http") ? "_blank" : undefined}
							rel="noopener noreferrer"
							aria-label={c.ariaLabel || c.label}
						>
							<div className="contact-icon">
								<i className={c.icon}></i>
							</div>
							<div className="contact-info">
								<h4>{c.label}</h4>
								<p>{c.value}</p>
							</div>
						</a>
					))}
				</div>

				{logoSrc && (
					<div className="contact-logo-wrap">
						<Image
							src={logoSrc}
							alt="Nabla Logo"
							className="contact-logo"
							width={120}
							height={120}
							style={{ height: "auto" }}
						/>
					</div>
				)}
			</div>
		</section>
	);
}
