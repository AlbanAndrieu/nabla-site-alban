const PRODUCT_URL = "https://www.amazon.fr/dp/B09H1CKTFP";
const UNIT_PRICE_EUR = 299.99;
const QUANTITY = 2;

export type FastPoolPlanCopy = {
	badge: string;
	title: string;
	purchase: string;
	unitPrice: string;
	totalPrice: string;
	architectureLabel: string;
	system: string;
	systemDevice: string;
	systemRole: string;
	fast: string;
	fastDevice: string;
	fastRole: string;
	fastUsage: string;
	data: string;
	dataDevice: string;
	dataRole: string;
	dataUsage: string;
	note: string;
};

function formatPrice(locale: string, amount: number): string {
	return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-GB", {
		style: "currency",
		currency: "EUR",
	}).format(amount);
}

export default function FastPoolPlan({
	copy,
	locale,
}: {
	copy: FastPoolPlanCopy;
	locale: string;
}) {
	const totalPrice = UNIT_PRICE_EUR * QUANTITY;

	return (
		<div className="card box-shadow mt-3">
			<div className="card-body">
				<div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
					<h5 className="h6 mb-0">{copy.title}</h5>
					<span className="badge text-bg-warning">{copy.badge}</span>
				</div>
				<p className="mb-3">
					<a href={PRODUCT_URL} target="_blank" rel="noopener noreferrer">
						{copy.purchase}
					</a>{" "}
					— {formatPrice(locale, UNIT_PRICE_EUR)} {copy.unitPrice},{" "}
					{formatPrice(locale, totalPrice)} {copy.totalPrice}.
				</p>

				<div className="row g-3" role="list" aria-label={copy.architectureLabel}>
					<div className="col-md-4" role="listitem">
						<div className="card h-100 border-secondary">
							<div className="card-body text-center">
								<div className="fw-bold small text-uppercase mb-2">{copy.system}</div>
								<div className="mb-1">{copy.systemDevice}</div>
								<code>boot-pool</code>
								<div className="small text-muted mt-2">{copy.systemRole}</div>
							</div>
						</div>
					</div>
					<div className="col-md-4" role="listitem">
						<div className="card h-100 border-primary">
							<div className="card-body text-center">
								<div className="fw-bold small text-uppercase mb-2">{copy.fast}</div>
								<div className="mb-1">{copy.fastDevice}</div>
								<code>{copy.fastRole}</code>
								<div className="small text-muted mt-2">{copy.fastUsage}</div>
							</div>
						</div>
					</div>
					<div className="col-md-4" role="listitem">
						<div className="card h-100 border-secondary">
							<div className="card-body text-center">
								<div className="fw-bold small text-uppercase mb-2">{copy.data}</div>
								<div className="mb-1">{copy.dataDevice}</div>
								<code>{copy.dataRole}</code>
								<div className="small text-muted mt-2">{copy.dataUsage}</div>
							</div>
						</div>
					</div>
				</div>

				<p className="small text-muted mt-3 mb-0">{copy.note}</p>
			</div>
		</div>
	);
}
