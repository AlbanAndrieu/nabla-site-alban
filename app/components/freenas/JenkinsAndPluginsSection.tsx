import Image from "next/image";

export default function JenkinsAndPluginsSection() {
	return (
		<>
			<section className="row main-cards-section justify-content-center">
				<div className="col-md-4 p-3">
					<div className="card box-shadow">
						<Image
							className="card-img-top"
							src="/assets/jenkins-basic.png"
							width={100}
							height={100}
							alt="Jenkins SDLC Platform"
							style={{ objectFit: "contain", margin: "0 auto" }}
						/>
						<div className="card-body">
							<h5>
								<b>
									Nabla{" "}
									<a href="https://jenkins.io/" target="_blank" rel="noopener">
										Jenkins
									</a>
								</b>
							</h5>
							<p className="card-text">
								Jenkins <b>Freestyle</b> jobs
							</p>
							<div className="d-flex justify-content-between align-items-center">
								<a
									href="http://albandrieu.com/jenkins"
									target="_blank"
									className="btn btn-sm btn-outline-secondary"
									rel="noopener"
								>
									Jenkins
								</a>
								<a
									href="/nabla.html"
									className="btn btn-sm btn-outline-secondary"
								>
									Report
								</a>
								<a
									className="btn btn-sm btn-outline-secondary"
									href="http://albandrieu.com/jenkins/jnlpJars/jenkins-cli.jar"
									download
								>
									Jenkins CLI
								</a>
							</div>
						</div>
					</div>
				</div>
			</section>
			<section className="row gaming-section main-cards-section justify-content-center">
				<div className="col-md-4 p-3">
					<div className="card box-shadow">
						<Image
							className="card-img-top"
							src="/assets/logo-freenas.jpg"
							width={50}
							height={50}
							alt="FreeNAS Storage Platform"
							style={{ objectFit: "contain", margin: "0 auto" }}
						/>
						<div className="card-body">
							<h5>
								<b>
									Nabla{" "}
									<a
										href="https://www.freenas.org/"
										target="_blank"
										rel="noopener"
									>
										FreeNAS
									</a>
								</b>
							</h5>
							<p className="card-text">
								FreeNAS <b>® © 2020 - iXsystems, Inc</b>
							</p>
							<div className="d-flex">
								<a
									href="https://albandrieu.com:7000/ui/dashboard"
									target="_blank"
									className="btn btn-sm btn-outline-secondary"
									rel="noopener"
								>
									HTTPS UI
								</a>
								<a
									href="https://albandrieu.com:81/"
									target="_blank"
									className="btn btn-sm btn-outline-secondary"
									rel="noopener"
								>
									HTTP UI
								</a>
							</div>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
