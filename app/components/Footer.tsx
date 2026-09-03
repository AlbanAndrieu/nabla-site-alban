import BackToTopButton from "@/components/BackToTopButton";
import ActionLink, { actionClassName } from "@/components/ui/ActionLink";
import ExternalLink from "@/components/ui/ExternalLink";
import styles from "./Footer.module.css";

const SOCIAL_LINKS = [
	{ href: "https://www.linkedin.com/in/nabla", label: "LinkedIn", iconClassName: "fab fa-linkedin-in" },
	{ href: "https://calendly.com/alban-andrieu", label: "Calendly", iconClassName: "fa fa-calendar-plus" },
	{ href: "https://github.com/AlbanAndrieu", label: "GitHub", iconClassName: "fab fa-github" },
	{ href: "https://hub.docker.com/u/nabla", label: "Docker Hub", iconClassName: "fab fa-docker" },
	{ href: "https://stackexchange.com/users/4652074/albanandrieu", label: "Stack Exchange", iconClassName: "fab fa-stack-exchange" },
] as const;

type FooterProps = {
	backHome: string;
	backToTop: string;
	backToTopAria: string;
	legalNotices: string;
	locale: string;
	rssFeedAria: string;
	copyright: string;
};

export default function Footer({
	backHome,
	backToTop,
	backToTopAria,
	legalNotices,
	locale,
	rssFeedAria,
	copyright,
}: FooterProps) {
	const homeHref = locale === "fr" ? "/fr" : "/";
	const legalHref = locale === "fr" ? "/fr/policy/legal" : "/policy/legal";

	return (
		<footer className={`${styles.root} footer`} role="contentinfo">
			<div className={`${styles.socialLinks} social-links`}>
				{SOCIAL_LINKS.map((link) => (
					<ExternalLink key={link.href} href={link.href} className={`${styles.socialLink} social-link`} aria-label={link.label}>
						<i className={link.iconClassName} aria-hidden="true" />
					</ExternalLink>
				))}
				<a href="/feed.xml" className={`${styles.socialLink} social-link`} aria-label={rssFeedAria}>
					<i className="fa fa-rss" aria-hidden="true" />
				</a>
			</div>
			<div className={`${styles.links} footer-links`}>
				<a href={legalHref}>{legalNotices}</a>
			</div>
			<nav className={styles.actions} aria-label="Footer navigation">
				<ActionLink href={homeHref}>
					<i className="fas fa-home" aria-hidden="true" />
					<span>{backHome}</span>
				</ActionLink>
				<BackToTopButton label={backToTop} ariaLabel={backToTopAria} className={actionClassName("secondary")} />
			</nav>
			<p className={`${styles.copyright} footer-copyright`} data-localized-copyright={copyright}>
				{copyright}
			</p>
		</footer>
	);
}
