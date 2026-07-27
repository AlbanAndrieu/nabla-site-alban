import Image from "next/image";

type ContactHeroProps = {
	contactCta: string;
	contactHref: string;
	current: string;
	cvCta: string;
	cvHref: string;
	experience: string;
	intro: string;
	role: string;
};

export default function ContactHero({
	contactCta,
	contactHref,
	current,
	cvCta,
	cvHref,
	experience,
	intro,
	role,
}: ContactHeroProps) {
	return (
		<header className="contact-hero">
			<div className="hero-content">
				<Image
					src="https://avatars1.githubusercontent.com/u/7859836"
					width={150}
					height={150}
					alt="Alban Andrieu — DevSecOps"
					className="contact-profile-image"
					unoptimized
				/>
				<h1 className="hero-title">Alban Andrieu</h1>
				<p className="hero-subtitle">{role}</p>
				<p className="hero-description">
					{current}{" "}
					<a
						className="contact-hero-link"
						href="https://www.jusmundi.com"
						target="_blank"
						rel="noopener noreferrer"
					>
						<Image
							src="/assets/nabla/jusmundi-favicon.ico"
							width={16}
							height={16}
							alt=""
							aria-hidden="true"
						/>
						Jus Mundi
					</a>
					. <br />
					{experience}
				</p>
				<p className="hero-description">{intro}</p>
				<div className="cta-buttons">
					<a className="btn btn-light btn-lg" href={contactHref}>
						<i className="fas fa-envelope" /> {contactCta}
					</a>
					<a className="btn btn-outline-light btn-lg" href={cvHref}>
						<i className="fas fa-file-pdf" /> {cvCta}
					</a>
				</div>
			</div>
		</header>
	);
}
