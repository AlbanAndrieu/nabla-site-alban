import React from "react";

export default function HomeLabSection() {
	return (
		<section
			className="py-4 page-truenas-secondary"
			aria-labelledby="nabla-on-stack-heading"
		>
			<div className="container">
				<h2 id="nabla-on-stack-heading" className="h4 mb-3">
					<i
						className="fas fa-layer-group text-primary me-2"
						aria-hidden="true"
					></i>
					Home lab for Security, AI and Freelance projects
				</h2>
				<p className="text-secondary mb-4">
					This home lab has been build to host the coming Nabla company projects
					and services.
				</p>
				<p>
					Goal is to test integration of Security and AI services and
					experiences attacks performed on my domains.
				</p>
				<div className="row justify-content-center">
					<div className="col-md-6 col-lg-4">
						<div className="card box-shadow h-100 border-secondary">
							<img
								className="img-fluid d-block mx-auto p-4"
								src="/assets/nabla/nabla-4.svg"
								width={140}
								height={140}
								alt="Nabla logo"
							/>
							<div className="card-body text-center border-top border-secondary">
								<h3 className="h5 card-title mb-1">Nabla</h3>
								<p className="card-text text-muted small mb-0">
									Nabla & project
								</p>
								<a
									href="/nabla.html"
									className="btn btn-sm btn-outline-primary mt-3"
								>
									Open nabla project
								</a>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
