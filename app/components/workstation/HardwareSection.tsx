import { getTranslations } from "next-intl/server";

export default async function HardwareSection() {
	const t = await getTranslations("workstation.hardware");

	return (
		<section
			className="category-section nabla-platforms-section hardware-section"
			aria-labelledby="hardware-heading"
		>
			<div className="container">
				<div className="row mb-4">
					<div className="col-12">
						<h2
							id="hardware-heading"
							className="hardware-heading-with-icon display-4"
						>
							<span
								className="hardware-heading-with-icon__glyph"
								aria-hidden="true"
							>
								<i className="fas fa-server" />
							</span>
							<span className="hardware-heading-with-icon__text">
								{t("title")}
							</span>
						</h2>
						<h3 className="h4 mb-2" id="nabla-workstation-heading">
							<i
								className="fas fa-database me-2 text-primary"
								aria-hidden="true"
							/>
							{t("workstationTitle")}
						</h3>
						<div className="hardware-platform-band">
							<div className="row justify-content-center">
								<div className="col-lg-8">
									<div className="box-shadow">
										<div className="card-body">
											<p className="card-text hardware-bom-intro mb-0">
												<span
													className="hardware-bom-intro__icon"
													aria-hidden="true"
												>
													<i className="fas fa-screwdriver-wrench" />
												</span>
												<span className="hardware-bom-intro__text">
													{t("intro")}
												</span>
											</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
