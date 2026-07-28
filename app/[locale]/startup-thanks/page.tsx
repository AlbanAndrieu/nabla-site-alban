import Script from "next/script";
import React from "react";

export default function StartupThanksPage() {
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
			</nav>
			<main
				id="main-content"
				role="main"
				className="container py-5 col-lg-7 text-center"
			>
				<p className="display-6 text-success mb-3" aria-hidden="true">
					<i className="fas fa-circle-check"></i>
				</p>
				<h1 className="h2 mb-3">Thank you — message received</h1>
				<p className="lead text-secondary mb-4">
					Your brief was sent to <strong>job@albandrieu.com</strong>. I usually
					reply within one business day. If it is urgent, you can also{" "}
					<a
						href="https://calendly.com/alban-andrieu"
						target="_blank"
						rel="noopener noreferrer"
					>
						schedule a call
					</a>
					.
				</p>
				<a href="/" className="btn btn-primary me-2">
					Back to home
				</a>
				<a href="/startup" className="btn btn-outline-secondary">
					Send another message
				</a>
			</main>
			<footer className="footer" role="contentinfo">
				<div className="footer-links">
					<a href="/policy/legal.html">Legal notices</a>
				</div>
				<p className="footer-copyright"></p>
			</footer>
			<Script
				src="/site-widgets.js"
				strategy="afterInteractive"
				data-print-pdf=""
			/>
		</div>
	);
}
