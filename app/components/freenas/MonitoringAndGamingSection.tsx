import React from "react";

export default function MonitoringAndGamingSection() {
	return (
		<>
			<section className="row monitoring-section main-cards-section justify-content-center">
				<div className="col-md-4 p-3">
					<div className="card box-shadow">
						<img
							className="img-fluid d-block mx-auto py-2"
							src="assets/logo-monitoring-simple.png"
							width="150"
							alt="Monitoring Tools"
						/>
						<div className="card-body">
							<h5>
								<b>Nabla Monitoring</b>
							</h5>
							<p className="card-text">
								System and application monitoring on Ubuntu
							</p>
							<div className="col-md-4">
								<a
									className="btn btn-sm btn-outline-secondary"
									href="https://192.168.1.61:10000/webalizer/view_log.cgi/%252Fvar%252Flog%252Fhttpd%252Dalbandrieu%252Ecom%252Daccess%252Elog/index.html"
									target="_blank"
									rel="noopener"
								>
									Awstats
								</a>
							</div>
						</div>
					</div>
				</div>
			</section>
			<section className="row gaming-section main-cards-section justify-content-center">
				<div className="col-md-4 p-3">
					<div className="card box-shadow">
						<img
							className="img-fluid d-block mx-auto py-2"
							src="assets/logo-gaming-simple.png"
							width="140"
							alt="Gaming Platform"
						/>
						<div className="card-body">
							<h5 className="">
								<b>Nabla Gaming</b>
							</h5>
							<p className="card-text">Gaming platforms and launchers</p>
							<div className="col-md-4">
								<a
									className="btn btn-sm btn-outline-secondary"
									href="https://lutris.net/user/AlbanAndrieu/library/"
									target="_blank"
									rel="noopener"
								>
									<img
										className="img-fluid d-block mx-auto my-1"
										src="assets/logo-lutris-simple.png"
										width="100"
										alt="Lutris"
									/>
									Lutris
								</a>
								<a
									className="btn btn-sm btn-outline-secondary"
									href="https://store.steampowered.com/"
									target="_blank"
									rel="noopener"
								>
									<img
										className="img-fluid d-block mx-auto my-1"
										src="assets/logo-steam-simple.png"
										width="100"
										alt="Steam"
									/>
									Steam
								</a>
							</div>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
