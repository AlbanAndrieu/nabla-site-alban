import { getLocale, getTranslations } from "next-intl/server";
import AnchoredHeading from "@/components/AnchoredHeading";
import FastPoolPlan from "./FastPoolPlan";
import { formatEuro } from "./formatters";
import GpuUpgradePlan from "./GpuUpgradePlan";
import {
	CURRENT_BUILD_TOTAL_EUR,
	HARDWARE_PURCHASES,
	REUSED_COMPONENT_ICONS,
} from "./hardwarePlan";
import InferenceModelSummary from "./InferenceModelSummary";

function ItemIcon({ name }: { name: string }) {
	return (
		<span className="hardware-bom-li__icon" aria-hidden="true">
			<i className={`fas ${name}`}></i>
		</span>
	);
}

export default async function BillOfMaterialsSection() {
	const [locale, t] = await Promise.all([
		getLocale(),
		getTranslations("truenas.page.bom"),
	]);
	const reusedItems = t.raw("reusedItems") as string[];
	const purchaseDetails = t.raw("purchaseDetails") as string[];

	return (
		<section className="py-5 hardware-bom-section" aria-labelledby="hardware-bom">
			<div className="container">
				<AnchoredHeading as="h3" id="hardware-bom" className="h5 mt-4 hardware-bom-heading">
					<span className="hardware-bom-heading__icon" aria-hidden="true">
						<i className="fas fa-clipboard-list"></i>
					</span>
					{t("title")}
				</AnchoredHeading>
				<h4 className="h6 text-muted mt-3 mb-2 hardware-bom-heading hardware-bom-heading--sub">
					<span className="hardware-bom-heading__icon" aria-hidden="true">
						<i className="fas fa-recycle"></i>
					</span>
					<span>{t("reusedTitle")}</span>
				</h4>
				<ul className="list-group list-group-flush hardware-bom-list mb-3">
					{reusedItems.map((item, index) => (
						<li className="list-group-item hardware-bom-li" key={item}>
							<ItemIcon name={REUSED_COMPONENT_ICONS[index]} />
							<span className="hardware-bom-li__body">{item}</span>
						</li>
					))}
				</ul>
				<h4 className="h6 text-muted mt-3 mb-2 hardware-bom-heading hardware-bom-heading--sub">
					<span className="hardware-bom-heading__icon" aria-hidden="true">
						<i className="fas fa-basket-shopping"></i>
					</span>
					<span>{t("newTitle")}</span>
				</h4>
				<ul className="list-group list-group-flush hardware-bom-list">
					{HARDWARE_PURCHASES.map((purchase, index) => (
						<li className="list-group-item hardware-bom-li" key={purchase.name}>
							<ItemIcon name={purchase.icon} />
							<span className="hardware-bom-li__body">
								{"href" in purchase ? (
									<a href={purchase.href} target="_blank" rel="noopener noreferrer">
										{purchase.name}
									</a>
								) : (
									purchase.name
								)}{" "}
								— {purchaseDetails[index]}
							</span>
						</li>
					))}
				</ul>
				<p className="hardware-bom-total mt-3 mb-0" role="status">
					<span className="hardware-bom-total__label">{t("totalLabel")}</span>
					<span className="hardware-bom-total__amount">
						{formatEuro(locale, CURRENT_BUILD_TOTAL_EUR)}
					</span>
					<span className="hardware-bom-total__note">{t("totalNote")}</span>
				</p>
				<div className="hardware-bom-upgrade-note mt-3">
					<AnchoredHeading
						as="h4"
						id="hardware-upgrades"
						className="h6 hardware-bom-upgrade-note__title mb-2"
					>
						{t("futureTitle")}
					</AnchoredHeading>
					<FastPoolPlan />
					<GpuUpgradePlan />
					<InferenceModelSummary />
				</div>
			</div>
		</section>
	);
}
