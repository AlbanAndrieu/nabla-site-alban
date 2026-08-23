/**
 * Adds best-effort browser reachability hints to legacy Nabla tool and
 * open-source links using favicon image probes. False negatives are possible.
 *
 * Homelab health is now owned by the React homelab components and FastAPI
 * snapshot; no homelab globals or server-side tunnel checks live here.
 */
(() => {
	var CONCURRENCY = 5;
	var IMAGE_TIMEOUT_MS = 6500;

	function probeImage(src) {
		return new Promise((resolve) => {
			var img = new Image();
			var timer = window.setTimeout(() => {
				img.onload = null;
				img.onerror = null;
				resolve(false);
			}, IMAGE_TIMEOUT_MS);
			img.onload = () => {
				window.clearTimeout(timer);
				resolve(true);
			};
			img.onerror = () => {
				window.clearTimeout(timer);
				resolve(false);
			};
			img.src =
				src + (src.indexOf("?") === -1 ? "?" : "&") + "_np=" + Date.now();
		});
	}

	function probeOrigin(origin) {
		var paths = ["/favicon.ico", "/favicon.png", "/apple-touch-icon.png"];
		var index = 0;
		var base = origin.replace(/\/$/, "");

		function attempt() {
			if (index >= paths.length) return Promise.resolve(false);
			var url = base + paths[index++];
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

	function setPingState(element, state) {
		element.classList.remove(
			"nabla-svc-ping--pending",
			"nabla-svc-ping--ok",
			"nabla-svc-ping--fail",
			"nabla-svc-ping--unknown",
		);

		if (state === "ok") {
			element.classList.add("nabla-svc-ping--ok");
			element.setAttribute("aria-label", "Host responded (favicon probe)");
			element.title =
				"Probe succeeded (favicon loaded). The app may still require auth.";
			return;
		}

		if (state === "fail") {
			element.classList.add("nabla-svc-ping--fail");
			element.setAttribute(
				"aria-label",
				"Unreachable from this browser or no favicon",
			);
			element.title =
				"Probe failed: offline, blocked, no favicon, or not reachable from your network.";
			return;
		}

		element.classList.add("nabla-svc-ping--unknown");
		element.setAttribute("aria-label", "Not probed");
		element.title = "This URL is not probed from the page (for example postgres://).";
	}

	function registerAnchor(anchor, seen) {
		var href = anchor.getAttribute("href");
		if (!href || href.charAt(0) === "#" || href.indexOf("javascript:") === 0) return;
		if (/^mailto:/i.test(href)) return;

		if (/^postgres:/i.test(href)) {
			var unknownPing = makePing();
			if (anchor.classList.contains("btn")) {
				anchor.appendChild(document.createTextNode(" "));
				anchor.appendChild(unknownPing);
			} else {
				anchor.insertAdjacentElement("afterend", unknownPing);
			}
			setPingState(unknownPing, "unknown");
			return;
		}

		var url;
		try {
			url = new URL(href, window.location.href);
		} catch {
			return;
		}
		if (url.protocol !== "http:" && url.protocol !== "https:") return;

		var ping = makePing();
		if (anchor.classList.contains("btn")) {
			anchor.appendChild(document.createTextNode(" "));
			anchor.appendChild(ping);
		} else {
			anchor.insertAdjacentElement("afterend", ping);
		}

		if (!seen[url.origin]) seen[url.origin] = [];
		seen[url.origin].push(ping);
	}

	function collectJobs() {
		var seen = Object.create(null);
		document
			.querySelectorAll(".nabla-platforms-section a.nabla-tool-tag-link[href]")
			.forEach((anchor) => registerAnchor(anchor, seen));
		document
			.querySelectorAll(
				"#services a.opensource-link[href], .opensource-section a.opensource-link[href]",
			)
			.forEach((anchor) => registerAnchor(anchor, seen));

		return Object.keys(seen).map((origin) => ({ origin, pings: seen[origin] }));
	}

	function runQueue(jobs) {
		var queue = jobs.slice();

		function worker() {
			var job = queue.shift();
			if (!job) return Promise.resolve();

			return probeOrigin(job.origin).then((ok) => {
				var state = ok ? "ok" : "fail";
				job.pings.forEach((ping) => setPingState(ping, state));
				return worker();
			});
		}

		var workers = [];
		for (var index = 0; index < CONCURRENCY; index++) workers.push(worker());
		return Promise.all(workers);
	}

	function init() {
		if (!document.body.classList.contains("page-nabla-best-practices")) return;
		var jobs = collectJobs();
		if (jobs.length) runQueue(jobs).catch(() => {});
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})();
