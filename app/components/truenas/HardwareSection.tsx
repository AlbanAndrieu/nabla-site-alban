import React from "react";

export default function HardwareSection() {
	return (
		<section
			className="py-5 hardware-section"
			aria-labelledby="hardware-heading"
		>
			<div className="container">
				<div className="row mb-4">
					<div className="col-12">
						<h2
							id="hardware-heading"
							className="hardware-heading-with-icon display-4"
						>
							<span
								className="hardware-heading-with-icon__glyph"
								aria-hidden="true"
							>
								<i className="fas fa-server"></i>
							</span>
							<span className="hardware-heading-with-icon__text">Hardware</span>
						</h2>
						<div className="hardware-platform-band">
							<p
								id="hardware-tagline"
								className="hardware-platform-band__tagline text-center"
							>
								One physical <strong>Mini-ITX</strong> system running{" "}
								<strong>TrueNAS Scale</strong>: dependable
								<strong> ZFS</strong> storage plus a homelab host for apps, home
								automation, security tooling, and compute-heavy tasks—including
								AI-style workloads when you need them.
							</p>
							<ul
								className="hardware-pill-grid"
								role="list"
								aria-label="What this platform is for"
							>
								<li className="hardware-pill">
									<span className="hardware-pill__icon" aria-hidden="true">
										<i className="fas fa-database"></i>
									</span>
									<span className="hardware-pill__text">
										<span className="hardware-pill__title">ZFS & datasets</span>
										<span className="hardware-pill__sub">
											Pools, snapshots, replication
										</span>
									</span>
								</li>
								<li className="hardware-pill">
									<span className="hardware-pill__icon" aria-hidden="true">
										<i className="fas fa-house-laptop"></i>
									</span>
									<span className="hardware-pill__text">
										<span className="hardware-pill__title">Homelab host</span>
										<span className="hardware-pill__sub">
											Apps, VMs, internal services
										</span>
									</span>
								</li>
								<li className="hardware-pill">
									<span className="hardware-pill__icon" aria-hidden="true">
										<i className="fas fa-shield-halved"></i>
									</span>
									<span className="hardware-pill__text">
										<span className="hardware-pill__title">Security stack</span>
										<span className="hardware-pill__sub">
											Tooling & monitoring
										</span>
									</span>
								</li>
								<li className="hardware-pill">
									<span className="hardware-pill__icon" aria-hidden="true">
										<i className="fas fa-microchip"></i>
									</span>
									<span className="hardware-pill__text">
										<span className="hardware-pill__title">AI & compute</span>
										<span className="hardware-pill__sub">
											AM5 headroom for models & jobs
										</span>
									</span>
								</li>
							</ul>
						</div>
					</div>
				</div>
				{/* Bill of materials, new/reused, etc. migrables section par section */}
			</div>
		</section>
	);
}
