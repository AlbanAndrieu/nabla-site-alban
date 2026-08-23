import HomelabServicesBlock from "../homelab/HomelabServicesBlock";

type Props = {
	title: string;
	lead: string;
	iconsBefore: string;
	iconsAfter: string;
	endpointLabel: string;
	internalLabel: string;
};

export default function AppsSection({
	title,
	lead,
	iconsBefore,
	iconsAfter,
	endpointLabel,
	internalLabel,
}: Props) {
	return (
		<section
			className="stack-page-hero py-5 page-truenas-apps"
			aria-labelledby="truenas-heading"
		>
			<div className="container">
				<div className="row mb-4">
					<div className="col-12 text-center">
						<h2 id="truenas-heading" className="display-4 mb-3">
							{title}
						</h2>
						<p className="lead mb-2 stack-page-hero__lead">{lead}</p>
						<p className="small text-secondary homelab-services-foss-note mb-0">
							{iconsBefore}{" "}
							<a
								href="https://selfh.st/icons/"
								target="_blank"
								rel="noopener noreferrer"
							>
								selfh.st/icons
							</a>
							. {iconsAfter}{" "}
							<a
								href="https://selfh.st/apps/"
								target="_blank"
								rel="noopener noreferrer"
							>
								selfh.st/apps
							</a>
							.
						</p>
					</div>
				</div>
				<HomelabServicesBlock
					endpointLabel={endpointLabel}
					internalLabel={internalLabel}
				/>
			</div>
		</section>
	);
}
