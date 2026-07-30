type HomelabService = {
	name: string;
	description: string;
	iconSrc: string;
	tunnelUrl?: string;
	tunnelSecure?: boolean;
	internalHost?: string;
	internalPort?: number;
	internalSecure?: boolean;
	reacheableFromOutside?: boolean;
};

import homelabData from "../../../public/homelab-services.json";

function lockerIcon(color: string) {
	return (
		<i
			className="fas fa-lock"
			style={{ color, marginRight: 5 }}
			aria-hidden="true"
		/>
	);
}

type Props = {
	tunnelLabel: string;
	internalLabel: string;
};

export default function ServiceGrid({ tunnelLabel, internalLabel }: Props) {
	const services = (homelabData.services as HomelabService[]) || [];
	return (
		<div className="row service-grid">
			{services.map((svc) => {
				const hasTunnel =
					typeof svc.tunnelUrl === "string" && svc.tunnelUrl.length > 0;
				const tunnelIsHttps = hasTunnel && svc.tunnelUrl!.startsWith("https");
				const hasInternal =
					typeof svc.internalHost === "string" && svc.internalPort;
				const iconPath = svc.iconSrc
					? svc.iconSrc.match(/svg$/)
						? "/" + svc.iconSrc.replace(".png", ".svg")
						: "/" + svc.iconSrc
					: "/assets/selfh-icons/generic-app.svg";
				let locker = null;
				if (hasTunnel) {
					if (!tunnelIsHttps) locker = lockerIcon("red");
					else if (svc.reacheableFromOutside === false)
						locker = lockerIcon("gold");
					else locker = lockerIcon("limegreen");
				}
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
									{hasTunnel && (
										<a
											href={svc.tunnelUrl}
											className="btn btn-outline-primary btn-sm d-block"
											target="_blank"
											rel="noopener noreferrer"
										>
											{locker}
											{tunnelLabel}
										</a>
									)}
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
