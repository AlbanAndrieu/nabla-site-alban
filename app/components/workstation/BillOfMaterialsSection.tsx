import { getTranslations } from "next-intl/server";
import Container from "@/components/ui/Container";
import ExternalLink from "@/components/ui/ExternalLink";
import { WORKSTATION_BOM } from "./workstationServices";

export default async function BillOfMaterialsSection() {
	const t = await getTranslations("workstation.hardware.bom");

	return (
		<section className="category-section nabla-platforms-section bill-of-materials-section">
			<Container>
				<div className="row mb-4">
					<div className="col-12">
						<h3 className="h5 mt-4 hardware-bom-heading">
							<span className="hardware-bom-heading__icon" aria-hidden="true">
								<i className="fas fa-clipboard-list" />
							</span>
							<span>{t("title")}</span>
						</h3>
						<h4 className="h6 text-muted mt-3 mb-2 hardware-bom-heading hardware-bom-heading--sub">
							<span className="hardware-bom-heading__icon" aria-hidden="true">
								<i className="fas fa-recycle" />
							</span>
							<span>{t("reused")}</span>
						</h4>
						<ul className="list-group list-group-flush hardware-bom-list mb-3">
							{WORKSTATION_BOM.reused.map((item) => (
								<li key={item.name} className="list-group-item hardware-bom-li">
									<span className="hardware-bom-li__icon" aria-hidden="true">
										<i className={item.iconClassName} />
									</span>
									<span className="hardware-bom-li__body">
										<ExternalLink href={item.href}>{item.name}</ExternalLink>
										{" — "}
										{item.details}
									</span>
								</li>
							))}
						</ul>
						<h4 className="h6 text-muted mt-3 mb-2 hardware-bom-heading hardware-bom-heading--sub">
							<span className="hardware-bom-heading__icon" aria-hidden="true">
								<i className="fas fa-basket-shopping" />
							</span>
							<span>{t("newPurchases")}</span>
						</h4>
						<ul className="list-group list-group-flush hardware-bom-list">
							{WORKSTATION_BOM.purchases.map((item) => (
								<li key={item.name} className="list-group-item hardware-bom-li">
									<span className="hardware-bom-li__icon" aria-hidden="true">
										<i className={item.iconClassName} />
									</span>
									<span className="hardware-bom-li__body">
										{item.name}: {item.details}
									</span>
								</li>
							))}
						</ul>
					</div>
				</div>
			</Container>
		</section>
	);
}
