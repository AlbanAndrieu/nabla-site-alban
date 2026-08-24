import { getLocale, getTranslations } from "next-intl/server";
import { formatEuro } from "./formatters";
import { FAST_POOL_PRODUCT } from "./hardwarePlan";

export default async function FastPoolPlan() {
	const [locale, t] = await Promise.all([
		getLocale(),
		getTranslations("truenas.upgrades.fastPool"),
	]);
	const totalPrice = FAST_POOL_PRODUCT.unitPriceEur * FAST_POOL_PRODUCT.quantity;

	return (
		<div className="card box-shadow mt-3">
			<div className="card-body">
				<div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
					<h5 className="h6 mb-0">{t("title")}</h5>
					<span className="badge text-bg-warning">{t("badge")}</span>
				</div>
				<p className="mb-3">
					<a href={FAST_POOL_PRODUCT.href} target="_blank" rel="noopener noreferrer">
						{t("purchase")}
					</a>{" "}
					— {formatEuro(locale, FAST_POOL_PRODUCT.unitPriceEur)} {t("unitPrice")},{" "}
					{formatEuro(locale, totalPrice)} {t("totalPrice")}.
				</p>

				<div className="row g-3" role="list" aria-label={t("architectureLabel")}>
					<div className="col-md-4" role="listitem">
						<div className="card h-100 border-secondary">
							<div className="card-body text-center">
								<div className="fw-bold small text-uppercase mb-2">{t("system")}</div>
								<div className="mb-1">{t("systemDevice")}</div>
								<code>boot-pool</code>
								<div className="small text-muted mt-2">{t("systemRole")}</div>
							</div>
						</div>
					</div>
					<div className="col-md-4" role="listitem">
						<div className="card h-100 border-primary">
							<div className="card-body text-center">
								<div className="fw-bold small text-uppercase mb-2">{t("fast")}</div>
								<div className="mb-1">{t("fastDevice")}</div>
								<code>{t("fastRole")}</code>
								<div className="small text-muted mt-2">{t("fastUsage")}</div>
							</div>
						</div>
					</div>
					<div className="col-md-4" role="listitem">
						<div className="card h-100 border-secondary">
							<div className="card-body text-center">
								<div className="fw-bold small text-uppercase mb-2">{t("data")}</div>
								<div className="mb-1">{t("dataDevice")}</div>
								<code>{t("dataRole")}</code>
								<div className="small text-muted mt-2">{t("dataUsage")}</div>
							</div>
						</div>
					</div>
				</div>

				<p className="small text-muted mt-3 mb-0">{t("note")}</p>
			</div>
		</div>
	);
}
