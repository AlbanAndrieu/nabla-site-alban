/**
 * Contact page: announce Slack/Discord opens for assistive tech; lazy-load Discord widget iframe.
 */
(() => {
	var STATUS_CLEAR_MS = 4000;

	function announce(el, text) {
		if (!el) return;
		el.textContent = "";
		void el.offsetWidth;
		el.textContent = text;
		if (announce._timer) window.clearTimeout(announce._timer);
		announce._timer = window.setTimeout(() => {
			el.textContent = "";
		}, STATUS_CLEAR_MS);
	}

	function wireChannelLinks() {
		var statusEl = document.getElementById("contact-channel-status");
		document
			.querySelectorAll("a.contact-channel-card[data-channel]")
			.forEach((link) => {
				link.addEventListener("click", () => {
					var ch = link.getAttribute("data-channel");
					var name =
						ch === "slack"
							? "Slack"
							: ch === "discord"
								? "Discord"
								: ch === "rss"
									? "RSS feed"
									: "Link";
					var tail = ch === "rss" ? "." : " in a new tab.";
					announce(statusEl, "Opening " + name + tail);
				});
			});
	}

	function lazyDiscordWidget() {
		var iframe = document.getElementById("contact-discord-widget");
		var wrap = iframe?.closest(".contact-discord-widget-wrap");
		var url = iframe?.getAttribute("data-src");
		if (!iframe || !wrap || !url) return;

		function load() {
			if (iframe.getAttribute("src")) return;
			iframe.setAttribute("src", url);
		}

		if (!("IntersectionObserver" in window)) {
			load();
			return;
		}

		var obs = new IntersectionObserver(
			(entries) => {
				for (var i = 0; i < entries.length; i++) {
					if (entries[i].isIntersecting) {
						load();
						obs.disconnect();
						break;
					}
				}
			},
			{ root: null, rootMargin: "100px 0px", threshold: 0 },
		);
		obs.observe(wrap);
	}

	function init() {
		wireChannelLinks();
		lazyDiscordWidget();
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})();
