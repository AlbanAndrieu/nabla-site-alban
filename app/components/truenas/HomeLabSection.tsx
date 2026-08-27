import Image from "next/image";
import { getTranslations } from "next-intl/server";
import AnchoredHeading from "@/components/AnchoredHeading";

export default async function HomeLabSection({
	nablaHref,
}: {
	nablaHref: string;
}) {
	const t = await getTranslations("truenas.page.homelab");

	return (
		<section className="py-4 page-truenas-secondary" aria-labelledby="homelab">
			<div className="container">
				<AnchoredHeading as="h2" id="homelab" className="h4 mb-3">
					<i
						className="fas fa-layer-group text-primary me-2"
						aria-hidden="true"
					></i>
					{t("title")}
				</AnchoredHeading>
				<p className="text-secondary mb-4">{t("intro")}</p>
				<p>{t("purpose")}</p>
				<div className="alert alert-secondary" role="note">
					<strong>FastAPI Cloud → Internet → pfSense:7000 → HAProxy → TrueNAS</strong>
					<p className="small mb-0 mt-2">
						The public TrueNAS endpoint is exposed through pfSense and HAProxy so
						FastAPI Cloud can perform controlled health and API probes without
						exposing the TrueNAS host directly.
					</p>
				</div>
				<div className="row justify-content-center">
					<div className="col-md-6 col-lg-4">
						<div className="card box-shadow h-100 border-secondary">
							<Image
								className="img-fluid d-block mx-auto p-4"
								src="/assets/nabla/nabla-4.svg"
								width={140}
								height={140}
								alt={t("logoAlt")}
								style={{ height: "auto" }}
							/>
							<div className="card-body text-center border-top border-secondary">
								<h3 className="h5 card-title mb-1">Nabla</h3>
								<p className="card-text text-muted small mb-0">
									{t("projectDescription")}
								</p>
								<a
									href={nablaHref}
									className="btn btn-sm btn-outline-primary mt-3"
									target="_blank"
									rel="noopener noreferrer"
								>
									{t("openProject")}
								</a>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
