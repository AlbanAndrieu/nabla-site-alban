import Image from "next/image";
import Script from "next/script";
import { getTranslations } from "next-intl/server";
import TopAnchor from "@/components/TopAnchor";

export default async function TestPage() {
	const site = await getTranslations("site");
	return (
		<div className="site-content-page page-dark">
			<TopAnchor />
			<a href="#main-content" className="skip-to-main">
				{site("skipToMainContent")}
			</a>
			<main id="main-content" role="main" className="mb-5">
				<section className="services-section" aria-labelledby="people-heading">
					<div className="container">
						<div className="row">
							<div className="col-md-12">
								<div className="row align-items-upcenter">
									<div className="col-md-2">
										<Image
											className="img-fluid d-block my-4"
											src="/assets/logo-labyrinth-simple.png"
											alt="Labyrinth illustration representing the difficult journey"
											width={128}
											height={128}
										/>
									</div>
									<div className="col-md-3 bg-warning">
										<h2 id="people-heading" className="section-title text-info">
											<br />
											OSINT &nbsp;
											<br />
											Framework
										</h2>
									</div>
									<div className="col-md-7">
										<div id="arf-viz-body" className="bg-light">
											<div id="arf-viz-header" className="text-dark">
												TBD
												<hr />
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>
			</main>
			<section className="contact-section" id="contact">
				<div className="contact-container">
					<h2 className="section-title">Let's Work Together</h2>
					<p className="section-subtitle">
						Ready to transform your DevOps practices? Get in touch to discuss
						your project.
					</p>
					<div className="contact-methods">
						<a href="mailto:job@albandrieu.com" className="contact-method">
							<div className="contact-icon">
								<i className="fas fa-envelope"></i>
							</div>
							<div className="contact-info">
								<h4>Email</h4>
								<p>job@albandrieu.com</p>
							</div>
						</a>
						<a
							href="https://www.linkedin.com/in/nabla"
							target="_blank"
							className="contact-method"
							rel="noopener"
						>
							<div className="contact-icon">
								<i className="fab fa-linkedin"></i>
							</div>
							<div className="contact-info">
								<h4>LinkedIn</h4>
								<p>Connect with me</p>
							</div>
						</a>
						<a
							href="https://calendly.com/alban-andrieu"
							target="_blank"
							className="contact-method"
							rel="noopener"
						>
							<div className="contact-icon">
								<i className="fa fa-calendar-plus"></i>
							</div>
							<div className="contact-info">
								<h4>Calendly</h4>
								<p>Have a call</p>
							</div>
						</a>
						<a
							href="https://github.com/AlbanAndrieu"
							target="_blank"
							className="contact-method"
							rel="noopener"
						>
							<div className="contact-icon">
								<i className="fab fa-github"></i>
							</div>
							<div className="contact-info">
								<h4>GitHub</h4>
								<p>View my work</p>
							</div>
						</a>

						<Image
							src="/assets/nabla/nabla-4.svg"
							alt="Nabla Logo"
							width={120}
							height={120}
							style={{ opacity: 0.6 }}
						/>
					</div>
				</div>
			</section>
			<Script
				src="/site-widgets.js"
				strategy="afterInteractive"
				data-scroll-reveal=".service-card,.skill-category,.tool-item"
				data-reveal-effect="animation"
				data-reveal-animation="fadeInUp 0.6s ease forwards"
				data-axeptio=""
				data-print-pdf=""
				data-coffee-fab=""
			/>
		</div>
	);
}
