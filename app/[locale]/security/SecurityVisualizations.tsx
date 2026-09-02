import Image from "next/image";
import Container from "@/components/ui/Container";
import ExternalLink from "@/components/ui/ExternalLink";
import SecurityArfTree from "./SecurityArfTree";
import styles from "./SecurityVisualizations.module.css";

type Props = Readonly<{ locale: string }>;

export default function SecurityVisualizations({ locale }: Props) {
	return (
		<section
			id="security-visualizations"
			className={styles.section}
			aria-labelledby="security-visualizations-heading"
		>
			<Container>
				<header className={styles.heading}>
					<h2 id="security-visualizations-heading">
						OSINT Framework &amp; Kali Linux
					</h2>
				</header>
				<div className={styles.grid}>
					<article className={styles.card}>
						<div className={styles.cardHeader}>
							<Image
								className={styles.logo}
								src="/assets/logo-hacker-simple.png"
								width={96}
								height={96}
								alt="Hacker illustration"
							/>
							<h3>OSINT Framework</h3>
						</div>
						<SecurityArfTree locale={locale} />
					</article>
					<article className={styles.card}>
						<div className={styles.cardHeader}>
							<Image
								className={styles.logo}
								src="/assets/logo-kali-linux-simple.png"
								width={96}
								height={96}
								alt="Kali Linux logo"
							/>
							<h3>Kali Linux</h3>
						</div>
						<ExternalLink
							className={styles.externalLink}
							href="https://www.kali-linux.fr/"
						>
							<span>Kali Linux</span>
							<i
								className="fa-solid fa-arrow-up-right-from-square"
								aria-hidden="true"
							/>
						</ExternalLink>
					</article>
				</div>
			</Container>
		</section>
	);
}
