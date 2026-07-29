export default function BillOfMaterialsSection() {
	return (
		<section className="category-section nabla-platforms-section bill-of-materials-section">
			<div className="container">
				<div className="row mb-4">
					<div className="col-12">
						<h3 className="h5 mt-4 hardware-bom-heading">
							<span className="hardware-bom-heading__icon" aria-hidden="true">
								<i className="fas fa-clipboard-list"></i>
							</span>
							<span>Bill of materials</span>
						</h3>
						<h4 className="h6 text-muted mt-3 mb-2 hardware-bom-heading hardware-bom-heading--sub">
							<span className="hardware-bom-heading__icon" aria-hidden="true">
								<i className="fas fa-recycle"></i>
							</span>
							<span>Reused</span>
						</h4>
						<ul className="list-group list-group-flush hardware-bom-list mb-3">
							<li className="list-group-item hardware-bom-li">
								<span className="hardware-bom-li__icon" aria-hidden="true">
									<i className="fas fa-server"></i>
								</span>
								<span className="hardware-bom-li__body">
									<a
										href="https://www.amazon.fr/dp/B0C3T39N6P"
										target="_blank"
										rel="noopener noreferrer"
									>
										Workstation
									</a>{" "}
									— Intel Core i7-9700K + ASUS ROG STRIX Z390-F GAMING + SSD
									Samsung 860 EVO M.2 500 Go. 767,77&nbsp;€
								</span>
							</li>
							<li className="list-group-item hardware-bom-li">
								<span className="hardware-bom-li__icon" aria-hidden="true">
									<i className="fas fa-microchip"></i>
								</span>
								<span className="hardware-bom-li__body">
									<a
										href="https://www.amazon.fr/dp/B0C3T39N6P"
										target="_blank"
										rel="noopener noreferrer"
									>
										Gigabyte GeForce RTX 2060
									</a>{" "}
									— 3.8&nbsp;GHz, 32&nbsp;MB L3. 212.75&nbsp;€
								</span>
							</li>
						</ul>
						<h4 className="h6 text-muted mt-3 mb-2 hardware-bom-heading hardware-bom-heading--sub">
							<span className="hardware-bom-heading__icon" aria-hidden="true">
								<i className="fas fa-basket-shopping"></i>
							</span>
							<span>New purchases</span>
						</h4>
						<ul className="list-group list-group-flush hardware-bom-list">
							<li className="list-group-item hardware-bom-li">
								<span className="hardware-bom-li__icon" aria-hidden="true">
									<i className="fas fa-hdd"></i>
								</span>
								<span className="hardware-bom-li__body">
									Storage: 2×Seagate BarraCuda — 2&nbsp;TB each, SATA
									6&nbsp;Gb/s. 2×109,99&nbsp;€
								</span>
							</li>
						</ul>
					</div>
				</div>
			</div>
		</section>
	);
}
