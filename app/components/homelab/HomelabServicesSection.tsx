import { getTranslations } from "next-intl/server";
import AnchoredHeading from "@/components/AnchoredHeading";
import ActionLink from "@/components/ui/ActionLink";
import HomelabServicesBlock from "./HomelabServicesBlock";

type Props = {
	headingId?: string;
};

export default async function HomelabServicesSection({
	headingId = "homelab-services",
}: Props) {
	const t = await getTranslations("homelab.section");

	return (
		<section
			className="stack-page-hero py-5 homelab-services-section page-truenas-apps"
			aria-labelledby={headingId}
		>
			<div className="container">
				<div className="row mb-4">
					<div className="col-12 text-center">
						<AnchoredHeading id={headingId} className="display-4 mb-3">
							{t("title")}
						</AnchoredHeading>
						<p className="lead mb-2 stack-page-hero__lead">{lead}</p>
						<p className="small text-secondary homelab-services-foss-note mb-3">
							{iconsBefore}{" "}
							<a href="https://selfh.st/icons/" target="_blank" rel="noopener noreferrer">
								selfh.st/icons
							</a>
							. {t("iconsAfter")}{" "}
							<a href="https://selfh.st/apps/" target="_blank" rel="noopener noreferrer">
								selfh.st/apps
							</a>
							.
						</p>
						<div className="d-flex flex-wrap gap-2 justify-content-center">
							<ActionLink
								href="architecture#declared-observed-architecture"
								variant="secondary"
							>
								Architecture · Declared / Observed / Health
							</ActionLink>
						</div>
					</div>
				</div>
				<HomelabServicesBlock />
			</div>
		</section>
	);
}
