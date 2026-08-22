import {
	homelabHealthForUrl,
	loadHomelabHealthSnapshot,
} from "../../../lib/homelabHealth";
import {
	loadHomelabServicesCatalog,
	type HomelabService,
} from "../../../lib/homelabServices";
import EndpointAction from "./EndpointAction";

type Props = {
	endpointLabel: string;
	internalLabel: string;
};

function isInternalEndpointUrl(url?: string): boolean {
	if (!url) return false;
	try {
		return new URL(url).hostname.endsWith(".int.albandrieu.com");
	} catch {
		return false;
	}
}

function serviceIconPath(iconSrc?: string): string {
	if (!iconSrc) return "/assets/selfh-icons/generic-app.svg";
	if (/^https?:\/\//i.test(iconSrc)) return iconSrc;
	return `/${iconSrc}`;
}

export default async function ServiceGrid({
	endpointLabel,
	internalLabel,
}: Props) {
	const [{ catalog }, { snapshot }] = await Promise.all([
		loadHomelabServicesCatalog(),
		loadHomelabHealthSnapshot(),
	]);
	const services: HomelabService[] = catalog.services;

	return (
		<div className="row service-grid">
			{services.map((svc) => {
				const hasInternal =
					typeof svc.internalHost === "string" && Boolean(svc.internalPort);
				const iconPath = serviceIconPath(svc.iconSrc);
				const isExternal = svc.external === true;
				const endpointEnabled =
					svc.endpointEnabled ??
					(isExternal || isInternalEndpointUrl(svc.tunnelUrl));
				const initialHealth = isExternal
					? homelabHealthForUrl(snapshot, svc.tunnelUrl)
					: undefined;

				return (
					<div
						className="col-md-4 p-3"
						key={`${svc.name}:${svc.tunnelUrl ?? svc.internalHost ?? "local"}`}
					>
						<div className="card box-shadow h-100 service-card-ux">
							<img
								className="img-fluid d-block mx-auto p-4"
								src={iconPath}
								width={80}
								height={80}
								alt={svc.name}
								loading="lazy"
								decoding="async"
								style={{ minHeight: 60, minWidth: 60, height: "auto" }}
							/>
							<div className="card-body text-center border-top border-secondary">
								<h3 className="h5 card-title mb-1">{svc.name}</h3>
								<p className="card-text text-muted small mb-0">
									{svc.description}
								</p>
								<div
									style={{
										marginTop: 18,
										display: "flex",
										flexDirection: "column",
										gap: 8,
									}}
								>
									<EndpointAction
										url={svc.tunnelUrl}
										enabled={endpointEnabled}
										external={isExternal}
										label={endpointLabel}
										initialHealth={initialHealth}
									/>
									{hasInternal && (
										<a
											href={`${svc.internalSecure ? "https" : "http"}://${svc.internalHost}:${svc.internalPort}`}
											className="btn btn-outline-secondary btn-sm d-block"
											target="_blank"
											rel="noopener noreferrer"
										>
											{svc.internalSecure && (
												<i
													className="fas fa-lock"
													style={{ color: "limegreen", marginRight: 5 }}
													aria-hidden="true"
												/>
											)}
											{internalLabel} ({svc.internalHost}:{svc.internalPort})
										</a>
									)}
								</div>
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}
