/**
 * Reachability hints via favicon image probe (no CORS read); false negatives are possible.
 * Used on nabla.html (tool tags, opensource links) and on homelab service cards (truenas.html + nabla.html).
 * Homelab cards: initHomelabServiceCardPings (alias initNablaHomelabServicePings), initHomelabTlsLockIndicators,
 * initHomelabTunnelTabIndicators — last two are invoked from homelab-services-render.js after cards mount.
 */
(() => {
	var CONCURRENCY = 5;
	var IMAGE_TIMEOUT_MS = 6500;

	function probeImage(src) {
		return new Promise((resolve) => {
			var img = new Image();
			var t = window.setTimeout(() => {
				img.onload = null;
				img.onerror = null;
				resolve(false);
			}, IMAGE_TIMEOUT_MS);
			img.onload = () => {
				window.clearTimeout(t);
				resolve(true);
			};
			img.onerror = () => {
				window.clearTimeout(t);
				resolve(false);
			};
			img.src =
				src + (src.indexOf("?") === -1 ? "?" : "&") + "_np=" + Date.now();
		});
	}

	function probeOrigin(origin) {
		var paths = ["/favicon.ico", "/favicon.png", "/apple-touch-icon.png"];
		var i = 0;
		var base = origin.replace(/\/$/, "");
		function attempt() {
			if (i >= paths.length) {
				return Promise.resolve(false);
			}
			var url = base + paths[i++];
			return probeImage(url).then((ok) => ok || attempt());
		}
		return attempt();
	}

	function makePing() {
		var span = document.createElement("span");
		span.className = "nabla-svc-ping nabla-svc-ping--pending";
		span.setAttribute("role", "img");
		span.setAttribute("aria-label", "Checking reachability");
		span.title =
			"Probing host via favicon; may be wrong if the app has no favicon or blocks hotlinking.";
		return span;
	}

	function setPingState(el, state) {
		el.classList.remove(
			"nabla-svc-ping--pending",
			"nabla-svc-ping--ok",
			"nabla-svc-ping--fail",
			"nabla-svc-ping--unknown",
		);
		if (state === "ok") {
			el.classList.add("nabla-svc-ping--ok");
			el.setAttribute("aria-label", "Host responded (favicon probe)");
			el.title =
				"Probe succeeded (favicon loaded). The app may still require auth.";
		} else if (state === "fail") {
			el.classList.add("nabla-svc-ping--fail");
			el.setAttribute(
				"aria-label",
				"Unreachable from this browser or no favicon",
			);
			el.title =
				"Probe failed: offline, blocked, no favicon, or not reachable from your network (e.g. LAN-only).";
		} else {
			el.classList.add("nabla-svc-ping--unknown");
			el.setAttribute("aria-label", "Not probed");
			el.title = "This URL is not probed from the page (e.g. postgres://).";
		}
	}

	function registerAnchor(a, seen) {
		var href = a.getAttribute("href");
		if (!href || href.charAt(0) === "#" || href.indexOf("javascript:") === 0) {
			return;
		}
		if (/^mailto:/i.test(href)) {
			return;
		}
		if (/^postgres:/i.test(href)) {
			var pingU = makePing();
			if (a.classList.contains("btn")) {
				a.appendChild(document.createTextNode(" "));
				a.appendChild(pingU);
			} else {
				a.insertAdjacentElement("afterend", pingU);
			}
			setPingState(pingU, "unknown");
			return;
		}
		var url;
		try {
			url = new URL(href, window.location.href);
		} catch {
			return;
		}
		if (url.protocol !== "http:" && url.protocol !== "https:") {
			return;
		}
		var origin = url.origin;
		var ping = makePing();
		if (a.classList.contains("btn")) {
			a.appendChild(document.createTextNode(" "));
			a.appendChild(ping);
		} else {
			a.insertAdjacentElement("afterend", ping);
		}
		if (!seen[origin]) {
			seen[origin] = [];
		}
		seen[origin].push(ping);
	}

	function seenToJobs(seen) {
		var jobs = [];
		Object.keys(seen).forEach((origin) => {
			jobs.push({ origin: origin, pings: seen[origin] });
		});
		return jobs;
	}

	function collectJobs() {
		var seen = Object.create(null);
		document
			.querySelectorAll(".nabla-platforms-section a.nabla-tool-tag-link[href]")
			.forEach((a) => {
				registerAnchor(a, seen);
			});
		document
			.querySelectorAll(
				"#services a.opensource-link[href], .opensource-section a.opensource-link[href]",
			)
			.forEach((a) => {
				registerAnchor(a, seen);
			});
		return seenToJobs(seen);
	}

	function runQueue(jobs) {
		var queue = jobs.slice();
		function worker() {
			function runNext() {
				var job = queue.shift();
				if (!job) {
					return Promise.resolve();
				}
				return probeOrigin(job.origin).then((ok) => {
					var state = ok ? "ok" : "fail";
					job.pings.forEach((p) => {
						setPingState(p, state);
					});
					return runNext();
				});
			}
			return runNext();
		}
		var workers = [];
		for (var w = 0; w < CONCURRENCY; w++) {
			workers.push(worker());
		}
		return Promise.all(workers);
	}

	function init() {
		if (!document.body.classList.contains("page-nabla-best-practices")) {
			return;
		}
		var jobs = collectJobs();
		if (!jobs.length) {
			return;
		}
		runQueue(jobs).catch(() => {});
	}

	function initHomelabServiceCardPings() {
		var seen = Object.create(null);
		document
			.querySelectorAll(
				".truenas-page-apps .homelab-service-card a.btn[href], .nabla-homelab-services .homelab-service-card a.btn[href]",
			)
			.forEach((a) => {
				registerAnchor(a, seen);
			});
		var jobs = seenToJobs(seen);
		if (!jobs.length) {
			return;
		}
		runQueue(jobs).catch(() => {});
	}

	/**
	 * Colors homelab HTTPS padlocks from a browser-side favicon probe.
	 */
	function initHomelabTlsLockIndicators() {
		var locks = document.querySelectorAll(
			".truenas-page-apps .homelab-tls-lock[data-homelab-tls-origin], .nabla-homelab-services .homelab-tls-lock[data-homelab-tls-origin]",
		);
		var seen = Object.create(null);
		for (var i = 0; i < locks.length; i++) {
			var el = locks[i];
			var o = el.getAttribute("data-homelab-tls-origin");
			if (!o) {
				continue;
			}
			if (!seen[o]) {
				seen[o] = [];
			}
			seen[o].push(el);
		}
		var keys = Object.keys(seen);
		if (!keys.length) {
			return;
		}
		var queue = keys.map((origin) => ({ origin: origin, els: seen[origin] }));
		function setTlsLockState(els, ok) {
			var cls = ok ? "homelab-tls-lock--ok" : "homelab-tls-lock--fail";
			var titleOk =
				"HTTPS: this browser completed TLS and loaded a favicon path (chain trusted or already accepted).";
			var titleFail =
				"HTTPS probe failed or ambiguous: self-signed/untrusted cert, unreachable from this network, or no favicon at common paths.";
			for (var j = 0; j < els.length; j++) {
				var lock = els[j];
				lock.classList.remove(
					"homelab-tls-lock--pending",
					"homelab-tls-lock--ok",
					"homelab-tls-lock--fail",
				);
				lock.classList.add(cls);
				lock.title = ok ? titleOk : titleFail;
				lock.setAttribute("role", "img");
				lock.setAttribute(
					"aria-label",
					ok ? "TLS probe succeeded" : "TLS probe failed",
				);
				lock.removeAttribute("aria-hidden");
			}
		}
		function worker() {
			var job = queue.shift();
			if (!job) {
				return Promise.resolve();
			}
			return probeOrigin(job.origin).then((ok) => {
				setTlsLockState(job.els, ok);
				return worker();
			});
		}
		var workers = [];
		for (var w = 0; w < CONCURRENCY; w++) {
			workers.push(worker());
		}
		Promise.all(workers).catch(() => {});
	}

	function classifyEndpoint(payload) {
		var status = typeof payload.status === "number" ? payload.status : 0;
		if (payload.tlsError === true) {
			return "fail";
		}
		if (status >= 200 && status <= 399) {
			return "ok";
		}
		if (status === 401 || status === 403 || status === 407 || status === 429) {
			return "warn";
		}
		return "fail";
	}

	function setTunnelTabVisual(anchor, state, detailTitle) {
		var keys = [
			"homelab-tunnel-tab--pending",
			"homelab-tunnel-tab--ok",
			"homelab-tunnel-tab--warn",
			"homelab-tunnel-tab--fail",
			"homelab-tunnel-tab--unknown",
		];
		for (var k = 0; k < keys.length; k++) {
			anchor.classList.remove(keys[k]);
		}
		anchor.classList.add("homelab-tunnel-tab--" + state);
		if (detailTitle) {
			anchor.title = detailTitle;
		}
	}

	function fetchTunnelCheck(url) {
		var qs = "/api/homelab-tunnel-check?url=" + encodeURIComponent(url);
		return fetch(qs, { cache: "no-store" }).then((res) => {
			if (res.status === 404) {
				return { apiMissing: true };
			}
			if (!res.ok) {
				return {
					status: 0,
					tlsError: false,
					httpError: res.status,
				};
			}
			return res.json().catch(() => ({
				status: 0,
				tlsError: false,
				parseError: true,
				httpError: res.status,
			}));
		});
	}

	function fetchBrowserEndpointStatus(url) {
		function request(method) {
			return fetch(url, {
				method: method,
				mode: "cors",
				cache: "no-store",
			}).then((res) => {
				if ((res.status === 405 || res.status === 501) && method === "HEAD") {
					return request("GET");
				}
				return { status: res.status, tlsError: false };
			});
		}
		return request("HEAD").catch(() => null);
	}

	function browserEndpointFallback(url, label) {
		return fetchBrowserEndpointStatus(url).then((browserData) => {
			if (browserData) {
				var browserState = classifyEndpoint(browserData);
				return {
					state: browserState,
					title:
						label +
						" browser probe: HTTP " +
						browserData.status +
						". Class: " +
						browserState +
						".",
				};
			}

			var origin;
			try {
				origin = new URL(url, window.location.href).origin;
			} catch {
				origin = "";
			}
			if (!origin) {
				return {
					state: "fail",
					title: label + " endpoint URL is invalid.",
				};
			}
			return probeOrigin(origin).then((ok) => ({
				state: ok ? "ok" : "fail",
				title: ok
					? label + " endpoint responded from this browser (favicon probe)."
					: label +
						" endpoint did not return a readable response or common favicon.",
			}));
		});
	}

	function applyTunnelState(job, result) {
		for (var j = 0; j < job.anchors.length; j++) {
			setTunnelTabVisual(job.anchors[j], result.state, result.title);
		}
	}

	/**
	 * Endpoint health is independent from exposure policy:
	 * - external=true: probe from the Next.js server when available, then fall back
	 *   to this browser if the checker route is missing or unhealthy;
	 * - external=false: read the HTTP status from this browser when CORS allows it,
	 *   otherwise fall back to a favicon probe for LAN/.int services.
	 */
	function initHomelabTunnelTabIndicators() {
		var sel =
			".truenas-page-apps .homelab-service-btn-tunnel[data-homelab-external], .nabla-homelab-services .homelab-service-btn-tunnel[data-homelab-external]";
		var anchors = document.querySelectorAll(sel);
		var byUrl = Object.create(null);
		for (var i = 0; i < anchors.length; i++) {
			var a = anchors[i];
			var href = a.getAttribute("href");
			if (!href || href.charAt(0) === "#") {
				continue;
			}
			if (href.indexOf("http://") !== 0 && href.indexOf("https://") !== 0) {
				continue;
			}
			if (!byUrl[href]) {
				byUrl[href] = { anchors: [], external: false };
			}
			byUrl[href].anchors.push(a);
			byUrl[href].external = a.getAttribute("data-homelab-external") === "true";
		}
		var urls = Object.keys(byUrl);
		if (!urls.length) {
			return;
		}
		var queue = urls.slice();
		function worker() {
			var u = queue.shift();
			if (!u) {
				return Promise.resolve();
			}
			var job = byUrl[u];
			if (!job.external) {
				return browserEndpointFallback(u, "Internal").then((result) => {
					applyTunnelState(job, result);
					return worker();
				});
			}
			return fetchTunnelCheck(u)
				.then((data) => {
					if (
						data.apiMissing ||
						data.parseError ||
						(data.httpError && !data.status)
					) {
						return browserEndpointFallback(u, "Public").then((result) => {
							var apiDetail = data.apiMissing
								? "Public endpoint checker route unavailable; "
								: data.parseError
									? "Public endpoint checker returned unreadable data; "
									: "Public endpoint checker returned HTTP " +
										data.httpError +
										"; ";
							result.title = apiDetail + result.title;
							applyTunnelState(job, result);
							return worker();
						});
					}
					var state = classifyEndpoint(data);
					var st = data.status != null ? data.status : "?";
					applyTunnelState(job, {
						state: state,
						title:
							"Public endpoint probe: HTTP " +
							st +
							". Class: " +
							state +
							".",
					});
					return worker();
				})
				.catch(() =>
					browserEndpointFallback(u, "Public").then((result) => {
						result.title = "Public endpoint checker failed; " + result.title;
						applyTunnelState(job, result);
						return worker();
					}),
				);
		}
		var workers = [];
		for (var w = 0; w < CONCURRENCY; w++) {
			workers.push(worker());
		}
		Promise.all(workers).catch(() => {});
	}

	window.initHomelabServiceCardPings = initHomelabServiceCardPings;
	window.initNablaHomelabServicePings = initHomelabServiceCardPings;
	window.initHomelabTlsLockIndicators = initHomelabTlsLockIndicators;
	window.initHomelabTunnelTabIndicators = initHomelabTunnelTabIndicators;

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})();