import FastPoolPlan from "./FastPoolPlan";
import GpuUpgradePlan from "./GpuUpgradePlan";

export type BillOfMaterialsCopy = {
	title: string;
	reusedTitle: string;
	reusedItems: string[];
	newTitle: string;
	purchaseDetails: string[];
	totalLabel: string;
	totalNote: string;
	futureTitle: string;
	futureItems: string[];
};

const REUSED_ICONS = ["fa-cube", "fa-plug", "fa-hard-drive", "fa-hdd"];

const PURCHASES = [
	{
		icon: "fa-server",
		name: "MSI MPG B650I Edge WiFi",
		href: "https://www.amazon.fr/dp/B0BHCRX6K7",
	},
	{
		icon: "fa-hard-drive",
		name: "ORICO mSATA SSD enclosure (USB 3.0, 5 Gbps)",
		href: "https://www.amazon.fr/dp/B0CKP48DMB",
	},
	{
		icon: "fa-fan",
		name: "Noctua NH-L9a-AM5",
		href: "https://www.amazon.fr/dp/B0BNL8ZM1T",
	},
	{
		icon: "fa-microchip",
		name: "AMD Ryzen 7 7700",
		href: "https://www.amazon.fr/dp/B0C3T39N6P",
	},
	{
		icon: "fa-memory",
		name: "Crucial DDR5 64 GB 5600 MHz",
		href: "https://www.amazon.fr/dp/B0DSQP6YR9",
	},
	{ icon: "fa-plug", name: "ATX 500 W PSU" },
] as const;

function ItemIcon({ name }: { name: string }) {
	return (
		<span className="hardware-bom-li__icon" aria-hidden="true">
			<i className={`fas ${name}`}></i>
		</span>
	);
}

export default function BillOfMaterialsSection({
	copy,
	locale,
}: {
	copy: BillOfMaterialsCopy;
	locale: string;
}) {
	return (
		<section id="hardware-bom" className="py-5 hardware-bom-section" aria-labelledby="bom-heading">
			<div className="container">
				<h3 id="bom-heading" className="h5 mt-4 hardware-bom-heading">
					<a className="text-reset text-decoration-none" href="#hardware-bom">
						<span className="hardware-bom-heading__icon" aria-hidden="true">
							<i className="fas fa-clipboard-list"></i>
						</span>
						{copy.title}<span className="ms-2 text-secondary" aria-hidden="true">#</span>
					</a>
				</h3>
				<h4 className="h6 text-muted mt-3 mb-2 hardware-bom-heading hardware-bom-heading--sub">
					<span className="hardware-bom-heading__icon" aria-hidden="true">
						<i className="fas fa-recycle"></i>
					</span>
					<span>{copy.reusedTitle}</span>
				</h4>
				<ul className="list-group list-group-flush hardware-bom-list mb-3">
					{copy.reusedItems.map((item, index) => (
						<li className="list-group-item hardware-bom-li" key={item}>
							<ItemIcon name={REUSED_ICONS[index]} />
							<span className="hardware-bom-li__body">{item}</span>
						</li>
					))}
				</ul>
				<h4 className="h6 text-muted mt-3 mb-2 hardware-bom-heading hardware-bom-heading--sub">
					<span className="hardware-bom-heading__icon" aria-hidden="true">
						<i className="fas fa-basket-shopping"></i>
					</span>
					<span>{copy.newTitle}</span>
				</h4>
				<ul className="list-group list-group-flush hardware-bom-list">
					{PURCHASES.map((purchase, index) => (
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
								— {copy.purchaseDetails[index]}
							</span>
						</li>
					))}
				</ul>
				<p className="hardware-bom-total mt-3 mb-0" role="status">
					<span className="hardware-bom-total__label">{copy.totalLabel}</span>
					<span className="hardware-bom-total__amount">1 184,31 €</span>
					<span className="hardware-bom-total__note">{copy.totalNote}</span>
				</p>
				<div id="hardware-upgrades" className="hardware-bom-upgrade-note mt-3">
					<p className="hardware-bom-upgrade-note__title mb-2">
						<a className="text-reset text-decoration-none" href="#hardware-upgrades">
							{copy.futureTitle}<span className="ms-2 text-secondary" aria-hidden="true">#</span>
						</a>
					</p>
					<ul className="hardware-bom-upgrade-note__list mb-0">
						{copy.futureItems.slice(0, 1).map((item) => (
							<li key={item}>{item}</li>
						))}
					</ul>
					<FastPoolPlan locale={locale} />
					<GpuUpgradePlan locale={locale} />
				</div>
			</div>
		</section>
	);
}
