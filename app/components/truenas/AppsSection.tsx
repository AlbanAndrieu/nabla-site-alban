import React from "react";
import ServiceGrid from "./ServiceGrid";

export default function AppsSection() {
	return (
		<section
			className="stack-page-hero py-5 page-truenas-apps"
			aria-labelledby="truenas-heading"
		>
			<div className="container">
				<div className="row mb-4">
					<div className="col-12 text-center">
						<h2 id="truenas-heading" className="display-4 mb-3">
							TrueNAS Services
						</h2>
						<p className="lead mb-2 stack-page-hero__lead">
							Self-hosted applications on TrueNAS Scale.
						</p>
						<p className="small text-secondary homelab-services-foss-note mb-0">
							Service icons are vendored from
							<a
								href="https://selfh.st/icons/"
								target="_blank"
								rel="noopener noreferrer"
							>
								{" "}
								selfh.st/icons
							</a>
							(selfhst/icons). For more open-source self-hosted ideas, see
							<a
								href="https://selfh.st/apps/"
								target="_blank"
								rel="noopener noreferrer"
							>
								{" "}
								selfh.st/apps
							</a>
							.
						</p>
					</div>
				</div>
				<ServiceGrid />
			</div>
		</section>
	);
}
