const GPU_OPTIONS = [
	{
		name: "NVIDIA RTX PRO 4000 Blackwell SFF",
		vram: "24 GB GDDR7 ECC",
		power: "70 W",
		formFactor: "168 mm, dual-slot, low-profile",
		fit: "Best fit for the existing compact chassis and 500 W PSU; preferred first inference upgrade.",
		href: "https://www.nvidia.com/products/workstations/professional-desktop-gpus/rtx-pro-4000-sff/",
	},
	{
		name: "NVIDIA RTX PRO 5000 Blackwell",
		vram: "48 GB GDDR7 ECC",
		power: "300 W",
		formFactor: "267 mm, dual-slot, full-height",
		fit: "Much larger LLM capacity, but likely requires a larger chassis and a stronger PSU.",
		href: "https://www.nvidia.com/products/workstations/professional-desktop-gpus/rtx-pro-5000/",
	},
	{
		name: "NVIDIA RTX PRO 6000 Blackwell Max-Q",
		vram: "96 GB GDDR7 ECC",
		power: "300 W",
		formFactor: "267 mm, dual-slot, full-height",
		fit: "Maximum local-inference target; chassis, airflow and PSU replacement should be assumed.",
		href: "https://www.nvidia.com/products/workstations/professional-desktop-gpus/rtx-pro-6000-max-q/",
	},
] as const;

const COPY = {
	fr: {
		title: "GPU pour l’inférence IA locale",
		lead: "La carte mère fournit un unique slot PCIe 4.0 x16. Le choix final dépend surtout de l’espace réel dans le châssis, de l’alimentation et de la VRAM nécessaire aux modèles.",
		vram: "VRAM",
		power: "Puissance",
		formFactor: "Format",
		ramTitle: "Mémoire système",
		ram: "Passer de 64 à 128 Go de DDR5 est possible : la MSI MPG B650I Edge WiFi possède 2 slots DDR5 et supporte officiellement 128 Go au maximum. L’objectif est d’ajouter un second module UDIMM 64 Go compatible, idéalement identique au module existant.",
		fit: [
			"Meilleur candidat pour le châssis compact actuel et l’alimentation 500 W ; premier choix recommandé pour l’inférence.",
			"Permet des LLM nettement plus volumineux, mais impose probablement un boîtier plus grand et une alimentation plus puissante.",
			"Cible maximale pour l’inférence locale ; prévoir un changement de boîtier, d’alimentation et une ventilation adaptée.",
		],
	},
	en: {
		title: "GPU options for local AI inference",
		lead: "The motherboard provides one PCIe 4.0 x16 slot. The final choice is primarily constrained by chassis clearance, PSU capacity and the VRAM required by the models.",
		vram: "VRAM",
		power: "Power",
		formFactor: "Form factor",
		ramTitle: "System memory",
		ram: "Upgrading from 64 to 128 GB DDR5 is supported: the MSI MPG B650I Edge WiFi has 2 DDR5 slots and officially supports up to 128 GB. The target is a second compatible 64 GB UDIMM, ideally matching the existing module.",
		fit: GPU_OPTIONS.map((option) => option.fit),
	},
} as const;

export default function GpuUpgradePlan({ locale }: { locale: string }) {
	const copy = locale === "fr" ? COPY.fr : COPY.en;

	return (
		<div className="mt-4">
			<h5 className="h6 mb-2">
				<i className="fas fa-microchip me-2" aria-hidden="true" />
				{copy.title}
			</h5>
			<p className="small text-muted">{copy.lead}</p>
			<div className="row g-3">
				{GPU_OPTIONS.map((gpu, index) => (
					<div className="col-lg-4" key={gpu.name}>
						<div className="card h-100 border-secondary">
							<div className="card-body">
								<h6 className="card-title">{gpu.name}</h6>
								<dl className="small mb-3">
									<div className="d-flex justify-content-between gap-3">
										<dt>{copy.vram}</dt><dd className="mb-1 text-end">{gpu.vram}</dd>
									</div>
									<div className="d-flex justify-content-between gap-3">
										<dt>{copy.power}</dt><dd className="mb-1 text-end">{gpu.power}</dd>
									</div>
									<div className="d-flex justify-content-between gap-3">
										<dt>{copy.formFactor}</dt><dd className="mb-1 text-end">{gpu.formFactor}</dd>
									</div>
								</dl>
								<p className="small text-muted">{copy.fit[index]}</p>
								<a href={gpu.href} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
									NVIDIA
								</a>
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
