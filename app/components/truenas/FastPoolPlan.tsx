const PRODUCT_URL = "https://www.amazon.fr/dp/B09H1CKTFP";
const UNIT_PRICE_EUR = 299.99;
const QUANTITY = 2;

const COPY = {
	fr: {
		badge: "Planifié",
		title: "Pool SSD rapide pour les services",
		purchase: "2 × WD Red SN700 1 To NVMe SSD",
		unitPrice: "l’unité",
		totalPrice: "au total",
		architectureLabel: "Architecture de stockage cible",
		system: "SYSTEM",
		systemDevice: "Kingston SKC600MS 256 Go via USB",
		systemRole: "TrueNAS OS",
		fast: "FAST",
		fastDevice: "2 × WD Red SN700 1 To",
		fastRole: "Mirror → fastpool",
		fastUsage: "Apps, datasets applicatifs et VM",
		data: "DATA",
		dataDevice: "4 × WD Red 3 To",
		dataRole: "RAIDZ → cpool",
		dataUsage: "Documents, médias et sauvegardes",
		note:
			"Les datasets applicatifs existants seront migrés sélectivement vers le pool SSD. Par exemple, /mnt/cpool/openwebui pourra devenir /mnt/fastpool/appdata/openwebui, tandis que les données volumineuses resteront sur cpool.",
	},
	en: {
		badge: "Planned",
		title: "Fast SSD pool for services",
		purchase: "2 × WD Red SN700 1 TB NVMe SSD",
		unitPrice: "each",
		totalPrice: "total",
		architectureLabel: "Target storage architecture",
		system: "SYSTEM",
		systemDevice: "Kingston SKC600MS 256 GB via USB",
		systemRole: "TrueNAS OS",
		fast: "FAST",
		fastDevice: "2 × WD Red SN700 1 TB",
		fastRole: "Mirror → fastpool",
		fastUsage: "Apps, application datasets and VMs",
		data: "DATA",
		dataDevice: "4 × WD Red 3 TB",
		dataRole: "RAIDZ → cpool",
		dataUsage: "Documents, media and backups",
		note:
			"Existing application datasets will be migrated selectively to the SSD pool. For example, /mnt/cpool/openwebui can become /mnt/fastpool/appdata/openwebui, while bulk data remains on cpool.",
	},
} as const;

function formatPrice(locale: string, amount: number): string {
	return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-GB", {
		style: "currency",
		currency: "EUR",
	}).format(amount);
}

export default function FastPoolPlan({ locale }: { locale: string }) {
	const copy = locale === "fr" ? COPY.fr : COPY.en;
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
					— {formatPrice(locale, UNIT_PRICE_EUR)} {copy.unitPrice}, {formatPrice(locale, totalPrice)}{" "}
					{copy.totalPrice}.
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
