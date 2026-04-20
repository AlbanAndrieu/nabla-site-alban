/**
 * Google Translate widget: ensures mount node, defines googleTranslateElementInit, loads Google script.
 *
 * Optional on <script src="…/site-google-translate.js" defer> (same directory depth as other public-root scripts): data-no-google-translate — skip entirely.
 * If #google_translate_element is missing, a fixed-position wrapper is prepended to <body> (see theme.css).
 */
(() => {
	var root = document.currentScript;
	if (root?.hasAttribute("data-no-google-translate")) return;
	if (window.__NABLA_GOOGLE_TRANSLATE_STARTED) return;
	window.__NABLA_GOOGLE_TRANSLATE_STARTED = true;

	var INCLUDED_LANGS = "en,fr,no,de,es,it,pt,nl,sv,da,fi,pl,cs,ru,ar,ja,zh-CN";

	var TOGGLE_SVG =
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';

	function bindMobileToggle(wrap, toggle) {
		function setOpen(open) {
			wrap.classList.toggle("is-open", open);
			toggle.setAttribute("aria-expanded", open ? "true" : "false");
		}
		toggle.addEventListener("click", (e) => {
			e.stopPropagation();
			setOpen(!wrap.classList.contains("is-open"));
		});
		document.addEventListener("click", (e) => {
			var t = e.target;
			if (t instanceof Node && !wrap.contains(t)) setOpen(false);
		});
		document.addEventListener("keydown", (e) => {
			if (e.key === "Escape") setOpen(false);
		});
	}

	function ensureMount() {
		var el = document.getElementById("google_translate_element");
		if (el) return el;
		var wrap = document.createElement("div");
		wrap.className = "google-translate-widget";
		wrap.setAttribute("aria-label", "Language translation options");

		var toggle = document.createElement("button");
		toggle.type = "button";
		toggle.className = "google-translate-widget__toggle";
		toggle.setAttribute("aria-expanded", "false");
		toggle.setAttribute("aria-controls", "google_translate_element");
		toggle.setAttribute("aria-label", "Choose translation language");
		toggle.innerHTML = TOGGLE_SVG;

		var panel = document.createElement("div");
		panel.className = "google-translate-widget__panel";

		el = document.createElement("div");
		el.id = "google_translate_element";
		panel.appendChild(el);

		wrap.appendChild(toggle);
		wrap.appendChild(panel);
		bindMobileToggle(wrap, toggle);

		var body = document.body;
		if (body) {
			body.insertBefore(wrap, body.firstChild);
			return el;
		}
		return null;
	}

	function loadExternal() {
		if (
			document.querySelector(
				'script[src*="translate.google.com/translate_a/element.js"]',
			)
		)
			return;
		var s = document.createElement("script");
		s.src =
			"https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
		(document.head || document.documentElement).appendChild(s);
	}

	function start() {
		var mount = ensureMount();
		if (!mount) return;
		loadExternal();
	}

	window.googleTranslateElementInit = () => {
		if (window.__NABLA_GOOGLE_TRANSLATE_READY) return;
		if (
			!window.google ||
			!google.translate ||
			!google.translate.TranslateElement
		)
			return;
		var mount = document.getElementById("google_translate_element");
		if (!mount) return;
		window.__NABLA_GOOGLE_TRANSLATE_READY = true;
		new google.translate.TranslateElement(
			{
				pageLanguage: "en",
				includedLanguages: INCLUDED_LANGS,
				layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
				autoDisplay: false,
			},
			"google_translate_element",
		);
	};

	if (document.body) {
		start();
	} else {
		document.addEventListener("DOMContentLoaded", start);
	}
})();
