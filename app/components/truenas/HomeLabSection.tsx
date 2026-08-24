import Image from "next/image";
import AnchoredHeading from "@/components/AnchoredHeading";

type Props = {
	title: string;
	intro: string;
	purpose: string;
	projectDescription: string;
	openProject: string;
	nablaHref: string;
};

export default function HomeLabSection({
	title,
	intro,
	purpose,
	projectDescription,
	openProject,
	nablaHref,
}: Props) {
	return (
		<section
			id="homelab"
			className="py-4 page-truenas-secondary"
			aria-labelledby="nabla-on-stack-heading"
		>
			<div className="container">
				<AnchoredHeading as="h2" id="nabla-on-stack-heading" className="h4 mb-3">
					<i
						className="fas fa-layer-group text-primary me-2"
						aria-hidden="true"
					></i>
					{title}
				</AnchoredHeading>
				<p className="text-secondary mb-4">{intro}</p>
				<p>{purpose}</p>
				<div className="row justify-content-center">
					<div className="col-md-6 col-lg-4">
						<div className="card box-shadow h-100 border-secondary">
							<Image
								className="img-fluid d-block mx-auto p-4"
								src="/assets/nabla/nabla-4.svg"
								width={140}
								height={140}
								alt="Nabla logo"
								style={{ height: "auto" }}
							/>
							<div className="card-body text-center border-top border-secondary">
								<h3 className="h5 card-title mb-1">Nabla</h3>
								<p className="card-text text-muted small mb-0">{projectDescription}</p>
								<a
									href={nablaHref}
									className="btn btn-sm btn-outline-primary mt-3"
									target="_blank"
									rel="noopener noreferrer"
								>
									{openProject}
								</a>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
