import Image from "next/image";
import Script from "next/script";

export default function LinkPage() {
	return (
		<div className="site-content-page page-dark">
			<div id="top" />
			<a href="#main-content" className="skip-to-main">
				Skip to main content
			</a>
			<nav className="page-nav container py-3" aria-label="Breadcrumb">
				<a href="/" className="text-decoration-none">
					<i className="fas fa-home" aria-hidden="true"></i> Back to home
				</a>
				<span className="text-muted mx-2" aria-hidden="true">
					·
				</span>
				<a href="/nabla" className="text-decoration-none">
					Nabla overview
				</a>
			</nav>
			<main id="main-content" className="container py-4 pb-5">
				<header className="mb-4 text-center">
					<h1 className="h2 mb-2">Profiles & registries in use</h1>
					<p className="section-subtitle mb-0">
						Public profiles and registries referenced from the{" "}
						<a href="/nabla">Nabla</a> DevSecOps overview.
					</p>
				</header>

				<section className="py-2" aria-labelledby="profiles-grid-heading">
					<h2 id="profiles-grid-heading" className="visually-hidden">
						Registry and profile links
					</h2>
					<div className="tools-grid">
						<div className="tool-item">
							<a
								href="https://github.com/AlbanAndrieu"
								target="_blank"
								rel="noopener noreferrer"
							>
								<Image
									src="/assets/logo-github-simple.png"
									alt="GitHub"
									width={100}
									height={100}
								/>
								<h4>GitHub</h4>
							</a>
						</div>
						<div className="tool-item">
							<a
								href="https://sonarcloud.io/organizations/albanandrieu-github/projects"
								target="_blank"
								rel="noopener noreferrer"
							>
								<Image
									src="/assets/logo-sonar.png"
									alt="SonarCloud"
									width={100}
									height={100}
								/>
								<h4>SonarCloud</h4>
							</a>
						</div>
						<div className="tool-item">
							<a
								href="https://hub.docker.com/u/nabla"
								target="_blank"
								rel="noopener noreferrer"
							>
								<Image
									src="/assets/logo-docker-hub-simple.png"
									alt="Docker Hub"
									width={100}
									height={100}
								/>
								<h4>Docker Hub</h4>
							</a>
						</div>
						<div className="tool-item">
							<a
								href="https://nexus.albandrieu.com/"
								target="_blank"
								rel="noopener noreferrer"
							>
								<Image
									src="/assets/logo-nexus.png"
									alt="Sonatype Nexus Repository"
									width={100}
									height={100}
								/>
								<h4>Nexus</h4>
							</a>
						</div>
					</div>
				</section>

				<section className="py-4 mt-2" aria-labelledby="freelance-refs-heading">
					<h2 id="freelance-refs-heading" className="h4 text-center mb-4">
						Freelance references
					</h2>
					<div className="tools-grid">
						<div className="tool-item">
							<a
								href="https://www.malt.fr/profile/albanandrieu"
								target="_blank"
								rel="noopener noreferrer"
							>
								<span className="d-block mb-3" aria-hidden="true">
									<i className="fa-solid fa-briefcase fa-3x"></i>
								</span>
								<h4>Malt</h4>
							</a>
						</div>
						<div className="tool-item">
							<a
								href="https://www.linkedin.com/in/nabla/"
								target="_blank"
								rel="noopener noreferrer"
							>
								<Image
									src="/assets/fontawesome-free-7.1.0-web/svgs/brands/linkedin-in.svg"
									alt="LinkedIn"
									width={100}
									height={100}
								/>
								<h4>LinkedIn</h4>
							</a>
						</div>
					</div>
				</section>
			</main>
			<footer className="footer">
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
				</div>
				<div className="footer-links">
					<a href="/policy/legal.html">Legal notices</a>
					<a
						href="javascript:openAxeptioCookies()"
						rel="noopener noreferrer"
						className="text-muted"
					>
						Cookies
					</a>
				</div>
				<p className="text-md-center mt-3">
					<a href="/" className="btn btn-sm btn-outline-secondary">
						Back to Home
					</a>
					<a
						href="#top"
						className="btn btn-sm btn-outline-secondary"
						aria-label="Back to top of page"
					>
						Back to top
					</a>
				</p>
				<p className="footer-copyright"></p>
			</footer>
			<Script
				src="/site-widgets.js"
				strategy="afterInteractive"
				data-print-pdf=""
				data-coffee-fab=""
				data-axeptio=""
			/>
		</div>
	);
}
