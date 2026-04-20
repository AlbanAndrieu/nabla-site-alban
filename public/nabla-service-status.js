/**
 * Reachability hints via favicon image probe (no CORS read); false negatives are possible.
 * Used on nabla.html (tool tags, opensource links) and on homelab service cards (truenas.html + nabla.html).
 * Homelab cards: initHomelabServiceCardPings (alias initNablaHomelabServicePings), called from homelab-services-render.js.
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

	window.initHomelabServiceCardPings = initHomelabServiceCardPings;
	window.initNablaHomelabServicePings = initHomelabServiceCardPings;

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})();
