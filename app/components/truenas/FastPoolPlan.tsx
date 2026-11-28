import { getTranslations } from "next-intl/server";
import { HARDWARE_UPGRADE_SOURCES } from "./hardwarePlan";

const failureTone = { color: "var(--ui-danger-text)" } as const;

export default async function FastPoolPlan() {
	const t = await getTranslations("truenas.upgrades.fastPool");

	return (
		<div className="card box-shadow mt-3">
			<div className="card-body">
				<div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
					<h5 className="h6 mb-0">{t("title")}</h5>
					<span className="badge text-bg-warning">{t("badge")}</span>
				</div>
				<p className="mb-2">{t("selection")}</p>
				<p className="fw-semibold mb-2">{t("capacity")}</p>
				<ul className="small mb-2" aria-label={t("optionsLabel")}>
					<li>
						<a href={HARDWARE_UPGRADE_SOURCES.kioxia}>{t("kioxia")}</a>
					</li>
					<li>
						<a href={HARDWARE_UPGRADE_SOURCES.lexar}>{t("lexar")}</a>
					</li>
				</ul>
				<p className="small text-muted mb-3">{t("priceNote")}</p>

				<div
					className="row g-3"
					role="list"
					aria-label={t("architectureLabel")}
				>
					<div className="col-md-4" role="listitem">
						<div className="card h-100 border-secondary">
							<div className="card-body text-center">
								<div className="fw-bold small text-uppercase mb-2">
									{t("system")}
								</div>
								<div className="mb-1">{t("systemDevice")}</div>
								<code style={failureTone}>boot-pool</code>
								<div className="small text-muted mt-2">{t("systemRole")}</div>
							</div>
						</div>
					</div>
					<div className="col-md-4" role="listitem">
						<div className="card h-100 border-primary">
							<div className="card-body text-center">
								<div className="fw-bold small text-uppercase mb-2">
									{t("fast")}
								</div>
								<div className="mb-1">{t("fastDevice")}</div>
								<code style={failureTone}>{t("fastRole")}</code>
								<div className="small text-muted mt-2">{t("fastUsage")}</div>
							</div>
						</div>
					</div>
					<div className="col-md-4" role="listitem">
						<div className="card h-100 border-secondary">
							<div className="card-body text-center">
								<div className="fw-bold small text-uppercase mb-2">
									{t("data")}
								</div>
								<div className="mb-1">{t("dataDevice")}</div>
								<code style={failureTone}>{t("dataRole")}</code>
								<div className="small text-muted mt-2">{t("dataUsage")}</div>
							</div>
						</div>
					</div>
				</div>

				<p className="small text-muted mt-3 mb-2">{t("note")}</p>
				<p className="small mb-2">{t("caution")}</p>
				<p className="small mb-0">
					{t("sources")}{" "}
					<a href={HARDWARE_UPGRADE_SOURCES.pools}>{t("poolGuide")}</a>
					{" · "}
					<a href={HARDWARE_UPGRADE_SOURCES.slog}>{t("slogGuide")}</a>
				</p>
			</div>
		</div>
	);
}
