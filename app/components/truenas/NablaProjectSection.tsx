import Image from "next/image";
import { getTranslations } from "next-intl/server";
import AnchoredHeading from "@/components/AnchoredHeading";

export default async function NablaProjectSection({
	nablaHref,
}: Readonly<{
	nablaHref: string;
}>) {
	const t = await getTranslations("truenas.page.homelab");

	return (
		<section className="py-5 page-truenas-secondary" aria-labelledby="nabla-project">
			<div className="container">
				<AnchoredHeading as="h2" id="nabla-project" className="h4 mb-4 text-center">
					{t("projectDescription")}
				</AnchoredHeading>
				<div className="row justify-content-center">
					<div className="col-md-7 col-lg-5">
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
								<h3 className="h5 card-title mb-2">Nabla</h3>
								<p className="card-text text-muted small mb-0">
									{t("projectDetails")}
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
