import type { Metadata } from "next";
import Script from "next/script";
import { NON_INDEXABLE_ROBOTS } from "@/lib/sitePageCatalog";

export async function generateMetadata({
	params,
}: PageProps<"/[locale]/startup">): Promise<Metadata> {
	const { locale } = await params;
	const isFrench = locale === "fr";

	return {
		title: isFrench
			? "Démarrer votre projet — Alban Andrieu"
			: "Start your project — Alban Andrieu",
		description: isFrench
			? "Présentez votre projet cloud, cybersécurité, conformité ou livraison à Alban Andrieu."
			: "Share your cloud, cybersecurity, compliance or delivery project with Alban Andrieu.",
		alternates: {
			canonical: isFrench ? "/fr/startup.html" : "/startup.html",
			languages: { en: "/startup.html", fr: "/fr/startup.html" },
		},
		robots: NON_INDEXABLE_ROBOTS,
	};
}

export default function StartupPage() {
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
				<span className="text-muted mx-2" aria-hidden="true">
					·
				</span>
				<a href="/contact" className="text-decoration-none">
					Contact
				</a>
			</nav>
			<main
				id="main-content"
				role="main"
				className="container py-4 pb-5 col-lg-8"
			>
				<header className="mb-4">
					<h1 className="h2 mb-2">Start your project</h1>
					<p className="lead text-secondary mb-0">
						Share a short brief — cloud platform, security, compliance, or
						delivery. I typically answer within one business day at{" "}
						<a href="mailto:job@albandrieu.com">job@albandrieu.com</a>. You can
						also{" "}
						<a
							href="https://calendly.com/alban-andrieu"
							target="_blank"
							rel="noopener noreferrer"
						>
							book a 30-minute call
						</a>
						.
					</p>
				</header>
				<div className="card border-secondary bg-body-secondary shadow-sm">
					<div className="card-body p-4">
						<form
							className="startup-inquiry-form"
							action="https://formsubmit.co/job@albandrieu.com"
							method="post"
							aria-labelledby="startup-form-heading"
						>
							<h2 id="startup-form-heading" className="h5 mb-3">
								Project brief
							</h2>
							<input
								type="hidden"
								name="_subject"
								value="[albanandrieu.com] Startup / project inquiry"
							/>
							<input
								type="hidden"
								name="_next"
								value="https://albanandrieu.com/startup-thanks.html"
							/>
							<input type="hidden" name="_captcha" value="true" />
							<input type="hidden" name="_template" value="table" />
							<input
								type="text"
								name="_honey"
								value=""
								tabIndex={-1}
								autoComplete="off"
								aria-hidden="true"
								className="position-absolute"
								style={{
									left: "-9999px",
									width: "1px",
									height: "1px",
									opacity: 0,
								}}
								readOnly
							/>
							<div className="mb-3">
								<label htmlFor="startup-name" className="form-label">
									Your name <span className="text-danger">*</span>
								</label>
								<input
									type="text"
									className="form-control"
									id="startup-name"
									name="name"
									required
									autoComplete="name"
									placeholder="Jane Doe"
								/>
							</div>
							<div className="mb-3">
								<label htmlFor="startup-email" className="form-label">
									Work email <span className="text-danger">*</span>
								</label>
								<input
									type="email"
									className="form-control"
									id="startup-email"
									name="email"
									required
									autoComplete="email"
									placeholder="you@company.com"
								/>
							</div>
							<div className="mb-3">
								<label htmlFor="startup-company" className="form-label">
									Company or product
								</label>
								<input
									type="text"
									className="form-control"
									id="startup-company"
									name="company"
									autoComplete="organization"
									placeholder="e.g. Acme AI"
								/>
							</div>
							<div className="mb-3">
								<label htmlFor="startup-context" className="form-label">
									What do you need help with?{" "}
									<span className="text-danger">*</span>
								</label>
								<textarea
									className="form-control"
									id="startup-context"
									name="message"
									rows={6}
									required
									placeholder="Stack (AWS, Azure, OVH…), AI needs, timeline, and any Security compliance goals (ISO 27001, SOC 2…)."
								></textarea>
							</div>
							<p className="small text-secondary mb-3">
								By sending this form you agree that your message is used only to
								respond to your request, as described in the{" "}
								<a href="/policy/legal.html">legal notices</a> and{" "}
								<a href="/policy/privacy_policy.html">privacy policy</a>.
							</p>
							<button type="submit" className="btn btn-primary">
								<i className="fas fa-paper-plane" aria-hidden="true"></i> Send
								to job@albandrieu.com
							</button>
						</form>
					</div>
				</div>
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
			/>
		</div>
	);
}
