import Image from "next/image";
import Script from "next/script";
import React from "react";

export default function NablaPage() {
	return (
		<div className="site-content-page page-dark page-nabla-best-practices">
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
				<a href="/truenas" className="text-decoration-none">
					TrueNAS
				</a>
				<span className="text-muted mx-2" aria-hidden="true">
					·
				</span>
				<span className="text-muted">Nabla project</span>
			</nav>
			{/* Hero Section */}
			<section className="hero-section" id="home">
				<div className="hero-content">
					<img
						src="https://avatars1.githubusercontent.com/u/7859836"
						alt="Alban Andrieu"
						className="profile-image"
						width={120}
						height={120}
					/>
					<h1 className="hero-title">Alban Andrieu</h1>
					<p className="hero-subtitle">
						DevSecOps Cloud Architect | Independent Consultant
					</p>
					<p className="hero-description">
						Currently architecting securing cloud solutions at{" "}
						<a
							href="https://www.jusmundi.com"
							target="_blank"
							rel="noopener noreferrer"
						>
							<img
								src="/assets/nabla/jusmundi-favicon.ico"
								alt=""
								width="16"
								height="16"
								className="jusmundi-link-icon"
								decoding="async"
								aria-hidden="true"
							/>
							Jus Mundi
						</a>
						.<br />
						With 20+ years of experience in enterprise environments, I
						specialize in transforming businesses through DevOps automation,
						cloud security, and infrastructure as code.
						<br />
						<br />
						Open to challenges around AI Integration, MLOps, and Security.
					</p>
					<div className="cta-buttons">
						<a href="#contact" className="btn btn-primary">
							<i className="fas fa-envelope"></i> Get in Touch
						</a>
						<a
							href="https://www.linkedin.com/in/nabla"
							target="_blank"
							className="btn btn-secondary"
							rel="noopener"
						>
							<i className="fab fa-linkedin"></i> View LinkedIn
						</a>
					</div>
				</div>
			</section>
			{/* Main Content */}
			<main id="main-content" role="main" className="mb-5">
				{/* Toolchain matrix, hardware, open source, services, contact sections */}
				{/* Migrate static section markup here as needed (omitted for brevity, see source) */}
			</main>
			{/* Footer */}
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
			{/* 3rd-party scripts needed for widgets/etc */}
			<Script
				src="https://uptime.betterstack.com/widgets/announcement.js"
				data-id="150620"
				async
				strategy="afterInteractive"
			/>
			<Script
				src="/nabla-service-status.js"
				strategy="afterInteractive"
				defer
			/>
			<Script
				src="/homelab-services-render.js"
				strategy="afterInteractive"
				defer
			/>
			<Script
				src="/site-widgets.js"
				strategy="afterInteractive"
				data-scroll-reveal=".contact-card,.social-card"
				data-reveal-effect="opacity"
				data-print-pdf=""
				data-coffee-fab=""
			/>
			{/* For google custom search */}
			<Script
				async
				src="https://cse.google.com/cse.js?cx=8090719dd778f44d0"
				strategy="afterInteractive"
			/>
		</div>
	);
}
