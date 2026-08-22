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

	/** Local app logos under `public/assets/` (see .cursor/rules for sourcing from selfh.st/icons). */
	function safeIconSrc(src) {
		const s = String(src ?? "").trim();
		if (!s || s.indexOf("..") >= 0 || s.includes("//")) {
			return "";
		}
		if (!/^assets\/[a-zA-Z0-9_.\-/]+$/.test(s)) {
			return "";
		}
		return s;
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

	function titleIconMarkup(s) {
		const src = safeIconSrc(s.iconSrc);
		if (src) {
			return `<img src="${esc(src)}" class="homelab-service-card__logo" width="24" height="24" alt="" decoding="async" aria-hidden="true" />`;
		}
		return iconsHtml(s.icons);
	}

	function defaultInternalTitle(variant, internalSecure) {
		if (variant === "truenas") {
			return internalSecure
				? "HTTPS on homelab Docker bridge 172.17.0.24; certificate may be self-signed"
				: "HTTP on homelab Docker bridge 172.17.0.24";
		}
		return "Homelab origin (Docker bridge or gateway)";
	}

	function defaultEndpointTitle(endpointUrl, isExternal) {
		if (!endpointUrl || typeof endpointUrl !== "string") {
			return "Endpoint";
		}
		const exposure = isExternal ? "public" : "internal/private";
		if (endpointUrl.indexOf("postgres:") === 0) {
			return `Postgres endpoint (${exposure})`;
		}
		if (endpointUrl.indexOf("https://") === 0) {
			return `HTTPS endpoint (${exposure})`;
		}
		if (endpointUrl.indexOf("http://") === 0) {
			return `HTTP endpoint (${exposure})`;
		}
		return `Endpoint (${exposure})`;
	}

	function isInternalEndpointUrl(endpointUrl) {
		if (!endpointUrl || typeof endpointUrl !== "string") {
			return false;
		}
		try {
			return new URL(endpointUrl).hostname.endsWith(".int.albandrieu.com");
		} catch {
			return false;
		}
	}

	const externalLinkAttrs = ' target="_blank" rel="noopener noreferrer"';

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
		const endpoint = typeof s.tunnelUrl === "string" ? s.tunnelUrl : "";
		if (endpoint.indexOf("postgres:") === 0) {
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

	/**
	 * Padlock next to Internal / Endpoint when JSON marks HTTPS; color set client-side
	 * from favicon probe (same limits as nabla-service-status.js).
	 */
	function homelabTlsLockMarkup(secureFlag, href) {
		if (secureFlag !== true) {
			return "";
		}
		const h = String(href || "");
		if (!h || h === "#") {
			return "";
		}
		let origin = "";
		try {
			const u = new URL(h, window.location.href);
			if (u.protocol !== "https:") {
				return "";
			}
			origin = u.origin;
		} catch {
			return "";
		}
		return `<span class="homelab-tls-lock homelab-tls-lock--pending" data-homelab-tls-origin="${esc(origin)}" title="Checking HTTPS (favicon probe)…" aria-hidden="true"><i class="fas fa-lock" aria-hidden="true"></i></span>`;
	}

	function disabledEndpointLockMarkup() {
		return '<span class="homelab-tls-lock text-secondary" title="Endpoint not configured for use" aria-hidden="true"><i class="fas fa-lock" aria-hidden="true"></i></span>';
	}

	function renderServiceCard(s, variant) {
		const name = esc(s.name);
		const icons = titleIconMarkup(s);
		const intHref = safeHref(buildInternalUrl(s));
		const isExternal = s.external === true;
		const rawEndpointUrl =
			typeof s.tunnelUrl === "string" && s.tunnelUrl.length > 0
				? s.tunnelUrl
				: "";
		const hasEndpointUrl = rawEndpointUrl.length > 0;
		const endpointEnabled =
			s.endpointEnabled ??
			(isExternal || isInternalEndpointUrl(rawEndpointUrl));
		const endpointActive = hasEndpointUrl && endpointEnabled;
		const endpointHref = hasEndpointUrl ? safeHref(rawEndpointUrl) : "";
		const intTitle = esc(
			s.internalTitle || defaultInternalTitle(variant, s.internalSecure),
		);
		const endpointTitle = esc(
			!hasEndpointUrl
				? "No endpoint URL configured"
				: endpointActive
					? s.tunnelTitle || defaultEndpointTitle(rawEndpointUrl, isExternal)
					: "Endpoint URL retained for inventory but not configured for use",
		);
		const aria = esc(`Open ${String(s.name).toLowerCase()}`);
		const desc = s.description ? esc(s.description) : "";
		const portSmall = s.portHtml
			? `<small class="text-muted d-block mt-2 mb-0">${s.portHtml}</small>`
			: `<small class="text-muted d-block mt-2 mb-0">Port: ${esc(String(s.internalPort))}</small>`;

		const descBlock = desc
			? `<p class="card-text text-muted small mb-2 flex-grow-0">${desc}</p>`
			: "";

		const intLock = homelabTlsLockMarkup(s.internalSecure === true, intHref);
		const endpointLock = endpointActive
			? homelabTlsLockMarkup(s.tunnelSecure === true, endpointHref)
			: disabledEndpointLockMarkup();

		const externalAttr = isExternal ? "true" : "false";
		const endpointProbe =
			endpointActive &&
			(endpointHref.startsWith("https:") || endpointHref.startsWith("http:"));
		const endpointStateClass = endpointProbe
			? " homelab-tunnel-tab--pending"
			: "";
		const endpointControl = endpointActive
			? `<a href="${endpointHref}" class="btn btn-outline-primary homelab-service-btn-tunnel${endpointStateClass}" data-homelab-external="${externalAttr}"${externalLinkAttrs} title="${endpointTitle}">
					<i class="fas fa-link" aria-hidden="true"></i><span class="ms-1">Endpoint</span>${endpointLock}
				</a>`
			: `<span class="btn btn-outline-secondary homelab-service-btn-tunnel disabled" aria-disabled="true" data-endpoint-url="${esc(rawEndpointUrl)}" title="${endpointTitle}">
					<i class="fas fa-link" aria-hidden="true"></i><span class="ms-1">Endpoint</span>${endpointLock}
				</span>`;

		const group = `<div class="truenas-app-actions d-grid gap-2 mt-2">
			<div class="btn-group btn-group-sm w-100" role="group" aria-label="${aria}">
				<a href="${intHref}" class="btn btn-outline-secondary homelab-service-btn-internal"${externalLinkAttrs} title="${intTitle}">
					<i class="fas fa-house-laptop" aria-hidden="true"></i><span class="ms-1">Internal</span>${intLock}
				</a>
				${endpointControl}
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

	/** Root-absolute fetch URL so JSON loads under App Router paths like `/en/nabla` (not `/en/homelab-services.json`). */
	function resolveHomelabJsonUrl(raw) {
		const p = String(raw ?? "homelab-services.json").trim();
		if (!p) return "/homelab-services.json";
		if (/^https?:\/\//i.test(p)) return p;
		if (p.startsWith("/")) return p;
		return `/${p.replace(/^\.\//, "")}`;
	}

	async function run() {
		const roots = document.querySelectorAll("[data-homelab-services-root]");
		if (!roots.length) {
			return;
		}
		const jsonPath = resolveHomelabJsonUrl(
			roots[0].getAttribute("data-homelab-json"),
		);
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
		if (typeof window.initHomelabTlsLockIndicators === "function") {
			window.initHomelabTlsLockIndicators();
		}
		if (typeof window.initHomelabTunnelTabIndicators === "function") {
			window.initHomelabTunnelTabIndicators();
		}
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", run);
	} else {
		run();
	}
})();
