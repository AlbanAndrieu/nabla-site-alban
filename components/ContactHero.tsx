import Image from "next/image";
import styles from "./ContactHero.module.css";

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
		<header className={styles.hero}>
			<div className={styles.content}>
				<Image
					src="https://avatars1.githubusercontent.com/u/7859836"
					width={150}
					height={150}
					alt={profileAlt}
					className={styles.profileImage}
					loading="eager"
					unoptimized
				/>
				<h1 className={styles.title}>Alban Andrieu</h1>
				<p className={styles.subtitle}>{role}</p>
				<p className={styles.description}>{experience}</p>
				<p className={styles.description}>{intro}</p>
				<div className={styles.actions}>
					<a
						className={`${styles.cta} ${styles.primaryCta}`}
						href={contactHref}
					>
						<i className="fas fa-envelope" aria-hidden="true" />
						<span>{contactCta}</span>
					</a>
					<a
						className={`${styles.cta} ${styles.secondaryCta}`}
						href={cvHref}
					>
						<i className="fas fa-file-pdf" aria-hidden="true" />
						<span>{cvCta}</span>
					</a>
				</div>
			</div>
		</header>
	);
}
