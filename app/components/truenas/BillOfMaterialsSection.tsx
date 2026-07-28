import React from "react";

export default function BillOfMaterialsSection() {
	return (
		<section
			className="py-5 hardware-bom-section"
			aria-labelledby="bom-heading"
		>
			<div className="container">
				<h3 id="bom-heading" className="h5 mt-4 hardware-bom-heading">
					<span className="hardware-bom-heading__icon" aria-hidden="true">
						<i className="fas fa-clipboard-list"></i>
					</span>
					Bill of materials
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
							<i className="fas fa-cube"></i>
						</span>
						<span className="hardware-bom-li__body">
							Case: previous iXsystems chassis, should be 170 mm × 170 mm,
							mini-ITX format
						</span>
					</li>
					<li className="list-group-item hardware-bom-li">
						<span className="hardware-bom-li__icon" aria-hidden="true">
							<i className="fas fa-plug"></i>
						</span>
						<span className="hardware-bom-li__body">
							PSU: previous 200 W power supply (I made a desing mistake, PSU do
							not fit MSI 8 pin CPU moetherboard)
						</span>
					</li>
					<li className="list-group-item hardware-bom-li">
						<span className="hardware-bom-li__icon" aria-hidden="true">
							<i className="fas fa-hard-drive"></i>
						</span>
						<span className="hardware-bom-li__body">
							Kingston SKC600MS mSATA SSD — 256 GB TLC 3D NAND. 83 €
						</span>
					</li>
					<li className="list-group-item hardware-bom-li">
						<span className="hardware-bom-li__icon" aria-hidden="true">
							<i className="fas fa-hdd"></i>
						</span>
						<span className="hardware-bom-li__body">
							Storage: 4× Western Digital Red WD30EFRX — 3 TB each, SATA 6 Gb/s
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
							<i className="fas fa-server"></i>
						</span>
						<span className="hardware-bom-li__body">
							<a
								href="https://www.amazon.fr/dp/B0BHCRX6K7"
								target="_blank"
								rel="noopener noreferrer"
							>
								MSI MPG B650I Edge WiFi
							</a>
							— Mini-ITX AM5, DDR5, PCIe 4.0, M.2, Wi‑Fi 6E (Ryzen 7000
							desktop). 174.67 €
						</span>
					</li>
					<li className="list-group-item hardware-bom-li">
						<span className="hardware-bom-li__icon" aria-hidden="true">
							<i className="fas fa-usb"></i>
						</span>
						<span className="hardware-bom-li__body">
							<a
								href="https://www.amazon.fr/dp/B0CKP48DMB"
								target="_blank"
								rel="noopener noreferrer"
							>
								ORICO mSATA SSD enclosure (USB 3.0, 5 Gbps)
							</a>
							— toolless adapter for 50×30 mm mSATA SSDs, up to 2 TB. 17.99 €
						</span>
					</li>
					<li className="list-group-item hardware-bom-li">
						<span className="hardware-bom-li__icon" aria-hidden="true">
							<i className="fas fa-fan"></i>
						</span>
						<span className="hardware-bom-li__body">
							<a
								href="https://www.amazon.fr/dp/B0BNL8ZM1T"
								target="_blank"
								rel="noopener noreferrer"
							>
								Noctua NH-L9a-AM5
							</a>
							— low-profile CPU cooler for AMD AM5. 49.90 €
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
								AMD Ryzen 7 7700
							</a>
							— 3.8 GHz, 32 MB L3. 212.75 €
						</span>
					</li>
					<li className="list-group-item hardware-bom-li">
						<span className="hardware-bom-li__icon" aria-hidden="true">
							<i className="fas fa-memory"></i>
						</span>
						<span className="hardware-bom-li__body">
							<a
								href="https://www.amazon.fr/dp/B0DSQP6YR9"
								target="_blank"
								rel="noopener noreferrer"
							>
								Crucial DDR5 64 GB 5600 MHz
							</a>
							— CL46 (CT64G56C46U5; also 5200/4800 MHz). 679.00 €
						</span>
					</li>
					<li className="list-group-item hardware-bom-li">
						<span className="hardware-bom-li__icon" aria-hidden="true">
							<i className="fas fa-plug"></i>
						</span>
						<span className="hardware-bom-li__body">
							PSU: ATX 500 W power supply (Aliexpress never delivered a PSU
							fitting into my frame). 50.00 €
						</span>
					</li>
				</ul>
				<p className="hardware-bom-total mt-3 mb-0" role="status">
					<span className="hardware-bom-total__label">Total price</span>
					<span className="hardware-bom-total__amount">1 184.31 €</span>
					<span className="hardware-bom-total__note">
						Sum of motherboard, enclosure, CPU, RAM, CPU cooler and PSU.
					</span>
				</p>
				<div className="hardware-bom-upgrade-note mt-3">
					<p className="hardware-bom-upgrade-note__title mb-2">
						Room to add later
					</p>
					<ul className="hardware-bom-upgrade-note__list mb-0">
						<li>
							<strong>Another 64 GB RAM</strong> — DDR5 <strong>UDIMM</strong>,
							form factor
							<strong> 288-pin DIMM / UDIMM</strong> (desktop unbuffered
							modules). When shopping, do <strong>not</strong> mix up{" "}
							<strong>SO-DIMM</strong> (laptop format) or
							<strong> RDIMM</strong> (registered server format): they will not
							fit this board.
						</li>
						<li>
							<strong>NVMe SSD</strong> — extra M.2 NVMe drive for fast pool or
							cache-style storage (pick a model that matches your board’s M.2
							specs and planned use).
						</li>
					</ul>
				</div>
			</div>
		</section>
	);
}
