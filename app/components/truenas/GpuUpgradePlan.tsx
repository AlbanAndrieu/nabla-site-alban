import { getLocale, getTranslations } from "next-intl/server";
import { formatEuro } from "./formatters";
import { GPU_OPTIONS } from "./hardwarePlan";

export default async function GpuUpgradePlan() {
	const [locale, t] = await Promise.all([
		getLocale(),
		getTranslations("truenas.upgrades.gpu"),
	]);
	const formFactors = t.raw("formFactors") as string[];
	const fit = t.raw("fit") as string[];

	return (
		<div className="mt-4">
			<h5 className="h6 mb-2">
				<i className="fas fa-microchip me-2" aria-hidden="true" />
				{t("title")}
			</h5>
			<p className="small text-muted mb-2">{t("lead")}</p>
			<p className="small text-muted">{t("priceSnapshot")}</p>
			<div className="row g-3">
				{GPU_OPTIONS.map((gpu, index) => (
					<div className="col-lg-4" key={gpu.name}>
						<div
							className={`card h-100 ${gpu.recommended ? "border-primary" : "border-secondary"}`}
						>
							<div className="card-body d-flex flex-column">
								<div className="d-flex align-items-start justify-content-between gap-2">
									<h6 className="card-title">{gpu.name}</h6>
									{gpu.recommended && (
										<span className="badge text-bg-primary">{t("recommended")}</span>
									)}
								</div>
								<dl className="small mb-3">
									<div className="d-flex justify-content-between gap-3">
										<dt>{t("vram")}</dt>
										<dd className="mb-1 text-end">{gpu.vram}</dd>
									</div>
									<div className="d-flex justify-content-between gap-3">
										<dt>{t("power")}</dt>
										<dd className="mb-1 text-end">{gpu.power}</dd>
									</div>
									<div className="d-flex justify-content-between gap-3">
										<dt>{t("formFactor")}</dt>
										<dd className="mb-1 text-end">{formFactors[index]}</dd>
									</div>
									<div className="d-flex justify-content-between gap-3">
										<dt>{gpu.priceMode === "from" ? t("fromPrice") : t("price")}</dt>
										<dd className="mb-1 text-end fw-semibold">
											{formatEuro(locale, gpu.priceEur)}
										</dd>
									</div>
								</dl>
								<p className="small text-muted">{fit[index]}</p>
								<div className="mt-auto d-flex flex-wrap gap-2">
									<a
										href={gpu.productHref}
										target="_blank"
										rel="noopener noreferrer"
										className="btn btn-sm btn-outline-primary"
									>
										{gpu.recommended ? "Amazon" : "NVIDIA"}
									</a>
									<a
										href={gpu.priceHref}
										target="_blank"
										rel="noopener noreferrer"
										className="btn btn-sm btn-outline-secondary"
									>
										{t("source")}
									</a>
								</div>
							</div>
						</div>
					</div>
				))}
			</div>
			<div className="alert alert-info mt-3 mb-0" role="note">
				<strong>{t("ramTitle")}:</strong> {t("ram")}
			</div>
		</div>
	);
}
