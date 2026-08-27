import Image from "next/image";
import { getTranslations } from "next-intl/server";
import AnchoredHeading from "@/components/AnchoredHeading";

export default async function ToolsSection() {
	const t = await getTranslations("truenas.page.tools");

	return (
		<section
			className="py-4 page-truenas-tools border-top border-secondary"
			aria-labelledby="truenas-tools"
		>
			<div className="container">
				<AnchoredHeading id="truenas-tools" className="h4 mb-4">
					<i
						className="fas fa-screwdriver-wrench text-primary me-2"
						aria-hidden="true"
					></i>
					{t("title")}
				</AnchoredHeading>
				<div className="row align-items-center g-4">
					<div className="col-md-6">
						<a
							className="stack-tool-link d-flex align-items-center gap-3 text-decoration-none p-3 rounded border border-secondary"
							href="https://truenas.albandrieu.com"
							target="_blank"
							rel="noopener noreferrer"
						>
							<Image
								src="/assets/logo-freenas-community-simple.jpeg"
								width="72"
								height="72"
								className="rounded flex-shrink-0"
								alt={t("logoAlt")}
								style={{ height: "auto" }}
							/>
							<span>
								<span className="d-block fw-semibold text-body">
									{t("webUi")}
								</span>
								<span className="d-block small text-muted">{t("signIn")}</span>
							</span>
						</a>
					</div>
				</div>
				<div className="stack-exchange-badge">
					<a
						href="https://stackexchange.com/users/4652074/albanandrieu"
						target="_blank"
						rel="noopener noreferrer"
					>
						<img
							src="https://stackexchange.com/users/flair/4652074.png"
							width="208"
							height="58"
							alt={t("stackExchangeAlt")}
							loading="lazy"
							decoding="async"
						/>
					</a>
				</div>
			</div>
		</section>
	);
}
