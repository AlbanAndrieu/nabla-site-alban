/**
 * Renders homelab service cards from homelab-services.json into elements marked with
 * data-homelab-services-root and data-homelab-variant (truenas | nabla).
 */
(() => {
	function esc(s) {
		return String(s ?? "")
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	function safeIconClass(c) {
		if (typeof c !== "string" || !/^[\w.\- ]+$/.test(c)) {
			return "fas fa-circle";
		}
		return c;
	}

	function iconsHtml(icons) {
		if (!icons || !icons.length) {
			return '<i class="fas fa-circle homelab-service-card__icon" aria-hidden="true"></i>';
		}
		return icons
			.map(
				(c) =>
					`<i class="${safeIconClass(c)} homelab-service-card__icon" aria-hidden="true"></i>`,
			)
			.join("");
	}

	function defaultInternalTitle(variant, internalSecure) {
		if (variant === "truenas") {
			return internalSecure
				? "HTTPS on homelab Docker bridge 172.17.0.24; certificate may be self-signed"
				: "HTTP on homelab Docker bridge 172.17.0.24";
		}
		return "Homelab origin (Docker bridge or gateway)";
	}

	function defaultTunnelTitle(tunnelUrl) {
		if (!tunnelUrl || typeof tunnelUrl !== "string") {
			return "Tunnel";
		}
		if (tunnelUrl.indexOf("postgres:") === 0) {
			return "Postgres via Cloudflare Tunnel (TCP)";
		}
		if (tunnelUrl.indexOf("https://") === 0) {
			return "HTTPS via Cloudflare Tunnel";
		}
		return "Tunnel endpoint";
	}

	function linkAttrs(newTab) {
		if (newTab === false) {
			return "";
		}
		return ' target="_blank" rel="noopener noreferrer"';
	}

	function safeHref(url) {
		const u = String(url || "");
		if (u.indexOf('"') >= 0 || u.indexOf("<") >= 0) {
			return "#";
		}
		return u;
	}

	/**
	 * Builds internal URL from internalHost, internalPort, internalSecure.
	 * Optional internalPath (e.g. "/#" for pfSense). Postgres when tunnelUrl uses postgres: scheme.
	 */
	function buildInternalUrl(s) {
		const host = String(s.internalHost ?? "").trim();
		const port = s.internalPort;
		if (!host || port === undefined || port === null || port === "") {
			return "#";
		}
		const tunnel = typeof s.tunnelUrl === "string" ? s.tunnelUrl : "";
		if (tunnel.indexOf("postgres:") === 0) {
			return `postgres://${host}:${port}/`;
		}
		const scheme = s.internalSecure ? "https" : "http";
		const path =
			typeof s.internalPath === "string" && s.internalPath.length > 0
				? s.internalPath.startsWith("/")
					? s.internalPath
					: `/${s.internalPath}`
				: "";
		return `${scheme}://${host}:${port}${path}`;
	}

	function renderServiceCard(s, variant) {
		const name = esc(s.name);
		const icons = iconsHtml(s.icons);
		const intHref = safeHref(buildInternalUrl(s));
		const tunHref = safeHref(s.tunnelUrl);
		const intTitle = esc(
			s.internalTitle || defaultInternalTitle(variant, s.internalSecure),
		);
		const tunTitle = esc(s.tunnelTitle || defaultTunnelTitle(s.tunnelUrl));
		const aria = esc(`Open ${String(s.name).toLowerCase()}`);
		const desc = s.description ? esc(s.description) : "";
		const portSmall = s.portHtml
			? `<small class="text-muted d-block mt-2 mb-0">${s.portHtml}</small>`
			: `<small class="text-muted d-block mt-2 mb-0">Port: ${esc(String(s.internalPort))}</small>`;

		const descBlock = desc
			? `<p class="card-text text-muted small mb-2 flex-grow-0">${desc}</p>`
			: "";

		const group = `<div class="truenas-app-actions d-grid gap-2 mt-2">
			<div class="btn-group btn-group-sm w-100" role="group" aria-label="${aria}">
				<a href="${intHref}" class="btn btn-outline-secondary"${linkAttrs(s.newTabInternal)} title="${intTitle}">
					<i class="fas fa-house-laptop" aria-hidden="true"></i><span class="ms-1">Internal</span>
				</a>
				<a href="${tunHref}" class="btn btn-outline-primary"${linkAttrs(s.newTabTunnel)} title="${tunTitle}">
					<i class="fas fa-cloud" aria-hidden="true"></i><span class="ms-1">Tunnel</span>
				</a>
			</div>
		</div>`;

		/* Same card chrome on TrueNAS and Nabla (responsive grid + compact title row). */
		return `<div class="col">
			<div class="card h-100 homelab-service-card">
				<div class="card-body py-3 px-3 d-flex flex-column">
					<h4 class="h6 card-title mb-2 d-flex align-items-center gap-2">${icons}<span>${name}</span></h4>
					${descBlock}
					${group}
					${portSmall}
				</div>
			</div>
		</div>`;
	}

	async function run() {
		const roots = document.querySelectorAll("[data-homelab-services-root]");
		if (!roots.length) {
			return;
		}
		const jsonPath =
			roots[0].getAttribute("data-homelab-json") || "homelab-services.json";
		let data;
		try {
			const res = await fetch(jsonPath, { cache: "no-store" });
			if (!res.ok) {
				throw new Error(res.statusText);
			}
			data = await res.json();
		} catch (e) {
			console.error("[homelab-services] Failed to load", jsonPath, e);
			return;
		}
		const services = data.services;
		if (!Array.isArray(services)) {
			return;
		}
		for (const root of roots) {
			const variant = root.getAttribute("data-homelab-variant") || "truenas";
			root.className = "row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3";
			root.innerHTML = services
				.map((s) => renderServiceCard(s, variant))
				.join("");
		}
		if (typeof window.initHomelabServiceCardPings === "function") {
			window.initHomelabServiceCardPings();
		} else if (typeof window.initNablaHomelabServicePings === "function") {
			window.initNablaHomelabServicePings();
		}
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", run);
	} else {
		run();
	}
})();
