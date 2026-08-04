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
	const actionStyle = { minWidth: "220px", maxWidth: "100%" };

	return (
		<footer className="footer text-center" role="contentinfo">
			<div className="social-links">
				<a
					href="https://www.linkedin.com/in/nabla"
					target="_blank"
					rel="noopener noreferrer"
					className="social-link"
					aria-label="LinkedIn"
				>
					<i className="fab fa-linkedin-in"></i>
				</a>
				<a
					href="https://calendly.com/alban-andrieu"
					target="_blank"
					rel="noopener noreferrer"
					className="social-link"
					aria-label="Calendly"
				>
					<i className="fa fa-calendar-plus"></i>
				</a>
				<a
					href="https://github.com/AlbanAndrieu"
					target="_blank"
					rel="noopener noreferrer"
					className="social-link"
					aria-label="GitHub"
				>
					<i className="fab fa-github"></i>
				</a>
				<a
					href="https://hub.docker.com/u/nabla"
					target="_blank"
					rel="noopener noreferrer"
					className="social-link"
					aria-label="Docker Hub"
				>
					<i className="fab fa-docker"></i>
				</a>
				<a
					href="https://stackexchange.com/users/4652074/albanandrieu"
					target="_blank"
					rel="noopener noreferrer"
					className="social-link"
					aria-label="Stack Exchange"
				>
					<i className="fab fa-stack-exchange"></i>
				</a>
				<a
					href="/feed.xml"
					className="social-link"
					aria-label={rssFeedAria}
				>
					<i className="fa fa-rss" aria-hidden="true"></i>
				</a>
			</div>
			<div className="footer-links text-center">
				<a href="/policy/legal.html">{legalNotices}</a>
			</div>
			<nav
				className="d-flex flex-column flex-sm-row justify-content-center align-items-center gap-2 mt-4 w-100"
				aria-label="Footer navigation"
			>
				<a
					href={homeHref}
					className="btn btn-primary d-inline-flex align-items-center justify-content-center gap-2 px-4"
					style={actionStyle}
				>
					<i className="fas fa-home" aria-hidden="true"></i>
					<span>{backHome}</span>
				</a>
				<a
					href="#top"
					className="btn btn-secondary d-inline-flex align-items-center justify-content-center gap-2 px-4"
					style={actionStyle}
					aria-label={backToTopAria}
				>
					<i className="fas fa-arrow-up" aria-hidden="true"></i>
					<span>{backToTop}</span>
				</a>
			</nav>
			<p className="footer-copyright text-center">{copyright}</p>
		</footer>
	);
}
