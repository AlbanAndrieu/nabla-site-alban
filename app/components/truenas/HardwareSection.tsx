import AnchoredHeading from "@/components/AnchoredHeading";

export type HardwareCopy = {
	title: string;
	incident: string;
	tagline: string;
	purposeLabel: string;
	pillars: Array<{ title: string; subtitle: string }>;
};

const PILLAR_ICONS = [
	"fa-database",
	"fa-house",
	"fa-shield-halved",
	"fa-microchip",
] as const;

export default function HardwareSection({ copy }: { copy: HardwareCopy }) {
	return (
		<section
			className="category-section nabla-platforms-section hardware-section"
			aria-labelledby="hardware"
		>
			<div className="container">
				<div className="row mb-4">
					<div className="col-12">
						<AnchoredHeading id="hardware" className="hardware-heading-with-icon display-4">
							<span
								className="hardware-heading-with-icon__glyph"
								aria-hidden="true"
							>
								<i className="fas fa-server"></i>
							</span>
							<span className="hardware-heading-with-icon__text">{copy.title}</span>
						</AnchoredHeading>
						<div className="hardware-platform-band mt-4">
							<div className="row justify-content-center">
								<div className="col-lg-8">
									<div className="card box-shadow">
										<div className="card-body">
											<p className="card-text hardware-bom-intro mb-0">
												<span
													className="hardware-bom-intro__icon"
													aria-hidden="true"
												>
													<i className="fas fa-screwdriver-wrench"></i>
												</span>
												<span className="hardware-bom-intro__text">{copy.incident}</span>
											</p>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div className="hardware-platform-band mt-4">
							<div className="box-shadow">
								<div className="card-body">
									<p
										id="hardware-tagline"
										className="hardware-platform-band__tagline text-center"
									>
										{copy.tagline}
									</p>
									<ul className="hardware-pill-grid" aria-label={copy.purposeLabel}>
										{copy.pillars.map((pillar, index) => (
											<li className="hardware-pill" key={pillar.title}>
												<span className="hardware-pill__icon" aria-hidden="true">
													<i className={`fas ${PILLAR_ICONS[index]}`} />
												</span>
												<span className="hardware-pill__text">
													<span className="hardware-pill__title">{pillar.title}</span>
													<span className="hardware-pill__sub">{pillar.subtitle}</span>
												</span>
											</li>
										))}
									</ul>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
