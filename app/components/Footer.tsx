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
	return (
		<footer className="footer" role="contentinfo">
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
			<div className="footer-links">
				<a href="/policy/legal.html">{legalNotices}</a>
			</div>
			<p className="text-md-center mt-3">
				<a href={homeHref} className="btn btn-sm btn-outline-secondary">
					{backHome}
				</a>
				<a
					href="#top"
					className="btn btn-sm btn-outline-secondary ms-2"
					aria-label={backToTopAria}
				>
					{backToTop}
				</a>
			</p>
			<p className="footer-copyright">{copyright}</p>
		</footer>
	);
}
