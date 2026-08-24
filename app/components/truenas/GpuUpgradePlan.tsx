const GPU_OPTIONS = [
	{
		name: "PNY NVIDIA RTX PRO 4000 Blackwell SFF Edition",
		vram: "24 GB GDDR7 ECC",
		power: "70 W",
		formFactor: "168 mm, dual-slot, low-profile",
		priceEur: 2483,
		priceMode: "observed",
		productHref: "https://www.amazon.fr/dp/B0GLJFC411",
		priceHref: "https://www.idealo.fr/prix/207997856/pny-nvidia-rtx-pro-4000-blackwell-sff.html",
		recommended: true,
	},
	{
		name: "NVIDIA RTX PRO 5000 Blackwell",
		vram: "48 GB GDDR7 ECC",
		power: "300 W",
		formFactor: "267 mm, dual-slot, full-height",
		priceEur: 7172.61,
		priceMode: "from",
		productHref: "https://www.nvidia.com/en-us/products/workstations/professional-desktop-gpus/rtx-pro-5000/",
		priceHref: "https://www.idealo.fr/prix/211801592/nvidia-rtx-pro-5000-blackwell-48-go.html",
		recommended: false,
	},
	{
		name: "NVIDIA RTX PRO 6000 Blackwell Max-Q",
		vram: "96 GB GDDR7 ECC",
		power: "300 W",
		formFactor: "267 mm, dual-slot, full-height",
		priceEur: 18888.97,
		priceMode: "from",
		productHref: "https://www.nvidia.com/en-us/products/workstations/professional-desktop-gpus/rtx-pro-6000-max-q/",
		priceHref: "https://www.idealo.fr/prix/206565584/nvidia-rtx-pro-6000-blackwell-max-q.html",
		recommended: false,
	},
] as const;

export type GpuUpgradePlanCopy = {
	title: string;
	lead: string;
	vram: string;
	power: string;
	formFactor: string;
	price: string;
	fromPrice: string;
	priceSnapshot: string;
	recommended: string;
	source: string;
	ramTitle: string;
	ram: string;
	fit: string[];
};

function formatPrice(locale: string, amount: number): string {
	return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-GB", {
		style: "currency",
		currency: "EUR",
	}).format(amount);
}

export default function GpuUpgradePlan({
	copy,
	locale,
}: {
	copy: GpuUpgradePlanCopy;
	locale: string;
}) {
	return (
		<div className="mt-4">
			<h5 className="h6 mb-2">
				<i className="fas fa-microchip me-2" aria-hidden="true" />
				{copy.title}
			</h5>
			<p className="small text-muted mb-2">{copy.lead}</p>
			<p className="small text-muted">{copy.priceSnapshot}</p>
			<div className="row g-3">
				{GPU_OPTIONS.map((gpu, index) => (
					<div className="col-lg-4" key={gpu.name}>
						<div className={`card h-100 ${gpu.recommended ? "border-primary" : "border-secondary"}`}>
							<div className="card-body d-flex flex-column">
								<div className="d-flex align-items-start justify-content-between gap-2">
									<h6 className="card-title">{gpu.name}</h6>
									{gpu.recommended && <span className="badge text-bg-primary">{copy.recommended}</span>}
								</div>
								<dl className="small mb-3">
									<div className="d-flex justify-content-between gap-3">
										<dt>{copy.vram}</dt>
										<dd className="mb-1 text-end">{gpu.vram}</dd>
									</div>
									<div className="d-flex justify-content-between gap-3">
										<dt>{copy.power}</dt>
										<dd className="mb-1 text-end">{gpu.power}</dd>
									</div>
									<div className="d-flex justify-content-between gap-3">
										<dt>{copy.formFactor}</dt>
										<dd className="mb-1 text-end">{gpu.formFactor}</dd>
									</div>
									<div className="d-flex justify-content-between gap-3">
										<dt>{gpu.priceMode === "from" ? copy.fromPrice : copy.price}</dt>
										<dd className="mb-1 text-end fw-semibold">{formatPrice(locale, gpu.priceEur)}</dd>
									</div>
								</dl>
								<p className="small text-muted">{copy.fit[index]}</p>
								<div className="mt-auto d-flex flex-wrap gap-2">
									<a href={gpu.productHref} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
										{gpu.recommended ? "Amazon" : "NVIDIA"}
									</a>
									<a href={gpu.priceHref} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-secondary">
										{copy.source}
									</a>
								</div>
							</div>
						</div>
					</div>
				))}
			</div>
			<div className="alert alert-info mt-3 mb-0" role="note">
				<strong>{copy.ramTitle}:</strong> {copy.ram}
			</div>
		</div>
	);
}
