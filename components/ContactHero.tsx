import Image from "next/image";

type ContactHeroProps = {
	contactCta: string;
	contactHref: string;
	current: string;
	cvCta: string;
	cvHref: string;
	experience: string;
	intro: string;
	profileAlt: string;
	role: string;
};

export default function ContactHero({
	contactCta,
	contactHref,
	cvCta,
	cvHref,
	experience,
	intro,
	profileAlt,
	role,
}: ContactHeroProps) {
	return (
		<header className="contact-hero">
			<div className="hero-content">
				<Image
					src="https://avatars1.githubusercontent.com/u/7859836"
					width={150}
					height={150}
					alt={profileAlt}
					className="contact-profile-image"
					loading="eager"
					unoptimized
				/>
				<h1 className="hero-title">Alban Andrieu</h1>
				<p className="hero-subtitle">{role}</p>
				<p className="hero-description">{experience}</p>
				<p className="hero-description">{intro}</p>
				<div className="cta-buttons">
					<a className="btn btn-light btn-lg" href={contactHref}>
						<i className="fas fa-envelope" aria-hidden="true" /> {contactCta}
					</a>
					<a className="btn btn-outline-light btn-lg" href={cvHref}>
						<i className="fas fa-file-pdf" aria-hidden="true" /> {cvCta}
					</a>
				</div>
			</div>
		</header>
	);
}
