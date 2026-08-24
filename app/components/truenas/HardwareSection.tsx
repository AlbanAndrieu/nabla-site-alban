import { getTranslations } from "next-intl/server";
import AnchoredHeading from "@/components/AnchoredHeading";

const PILLAR_ICONS = [
	"fa-database",
	"fa-house",
	"fa-shield-halved",
	"fa-microchip",
] as const;

type Pillar = { title: string; subtitle: string };

export default async function HardwareSection() {
	const t = await getTranslations("truenas.page.hardware");
	const pillars = t.raw("pillars") as Pillar[];

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
							<span className="hardware-heading-with-icon__text">{t("title")}</span>
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
												<span className="hardware-bom-intro__text">{t("incident")}</span>
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
										{t("tagline")}
									</p>
									<ul className="hardware-pill-grid" aria-label={t("purposeLabel")}>
										{pillars.map((pillar, index) => (
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
