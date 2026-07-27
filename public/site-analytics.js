/**
 * Site analytics (Vercel, optional VWO / PostHog / Heap / Datadog RUM, Google Tag Manager, gtag).
 * Load in <head> without async/defer so VWO anti-flicker can run early (home/full/marketing).
 *
 * data-analytics-mode:
 *   - "vercel" (default): Vercel Web Analytics + Speed Insights only
 *   - "full": GTM + gtag, then VWO, PostHog, Heap, Datadog RUM, then Vercel
 *   - "marketing": GTM + gtag, then VWO, PostHog, Heap, then Vercel (no Datadog)
 *   - "home": Mixpanel loader, GTM + gtag, then same as "full" (use this instead of a duplicate Mixpanel inline snippet in HTML)
 *
 * Optional: data-ahrefs-key="…" — loads Ahrefs Web Analytics (any mode).
 * Local dev: on localhost / 127.0.0.1 / ::1, Ahrefs and Vercel insight `<script src>` tags
 * are skipped (Ahrefs ignores localhost anyway; `/_vercel/*` often serves HTML in `next dev`).
 * E2E that must assert those tags: open the page with `?nablaEnableThirdParty=1`.
 * Optional: data-gtm-id, data-ga-measurement-id — override default GTM container and GA4 id.
 * Optional: window.NABLA_ANALYTICS_PRESET = { gtmContainerId, gaMeasurementId } when no script attrs.
 *
 * After load: window.NABLA_SITE_ANALYTICS.initGtm(id?), initGtag(id?) — no-op if already injected.
 */
(() => {
	var root = document.currentScript;
	var mode = root
		? root.getAttribute("data-analytics-mode") || "vercel"
		: window.NABLA_ANALYTICS_MODE || "vercel";

	var heavy = mode === "full" || mode === "marketing" || mode === "home";

	var preset = window.NABLA_ANALYTICS_PRESET || {};
	var DEFAULT_GTM_CONTAINER_ID = "GTM-W7XNV7K6";
	var DEFAULT_GA_MEASUREMENT_ID = "G-RHL13BHK6K";
	var gtmInjected = false;
	var gtagInjected = false;

	function thirdPartyAnalyticsBypassLocal() {
		try {
			return /(?:^|[?&])nablaEnableThirdParty=1(?:&|$)/.test(
				location.search || "",
			);
		} catch {
			return false;
		}
	}

	function isLikelyLocalHost() {
		try {
			var h = location.hostname;
			return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
		} catch {
			return false;
		}
	}

	function skipRemoteAnalyticsOnLocalDev() {
		return isLikelyLocalHost() && !thirdPartyAnalyticsBypassLocal();
	}

	function loadAhrefsFromAttr() {
		if (skipRemoteAnalyticsOnLocalDev()) return;
		var key = root?.getAttribute("data-ahrefs-key");
		if (!key) return;
		var s = document.createElement("script");
		s.src = "https://analytics.ahrefs.com/analytics.js";
		s.setAttribute("data-key", key);
		s.async = true;
		document.head.appendChild(s);
	}

	function initMixpanel() {
		((f, b) => {
			if (!b.__SV) {
				var e, g, i, h;
				window.mixpanel = b;
				b._i = [];
				b.init = (e, f, c) => {
					function g(a, d) {
						var b = d.split(".");
						2 === b.length && ((a = a[b[0]]), (d = b[1]));
						a[d] = (...args) => {
							a.push([d].concat(args));
						};
					}
					var a = b;
					"undefined" !== typeof c ? (a = b[c] = []) : (c = "mixpanel");
					a.people = a.people || [];
					a.toString = (a) => {
						var d = "mixpanel";
						"mixpanel" !== c && (d += "." + c);
						a || (d += " (stub)");
						return d;
					};
					a.people.toString = () => a.toString(1) + ".people (stub)";
					i =
						"disable time_event track track_pageview track_links track_forms track_with_groups add_group set_group remove_group register register_once alias unregister identify name_tag set_config reset opt_in_tracking opt_out_tracking has_opted_in_tracking has_opted_out_tracking clear_opt_in_out_tracking start_batch_senders people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user people.remove".split(
							" ",
						);
					for (h = 0; h < i.length; h++) g(a, i[h]);
					var j = "set set_once union unset remove delete".split(" ");
					a.get_group = (...getGroupArgs) => {
						function b(c) {
							d[c] = (...callArgs) => {
								a.push([e, [c].concat(callArgs)]);
							};
						}
						for (
							var d = {}, _e = ["get_group"].concat(getGroupArgs), c = 0;
							c < j.length;
							c++
						)
							b(j[c]);
						return d;
					};
					b._i.push([e, f, c]);
				};
				b.__SV = 1.2;
				e = f.createElement("script");
				e.type = "text/javascript";
				e.async = !0;
				e.src =
					"undefined" !== typeof MIXPANEL_CUSTOM_LIB_URL
						? MIXPANEL_CUSTOM_LIB_URL
						: "file:" === f.location.protocol &&
								"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js".match(/^\/\//)
							? "https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js"
							: "//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";
				g = f.getElementsByTagName("script")[0];
				g.parentNode.insertBefore(e, g);
			}
		})(document, window.mixpanel || []);
	}

	function resolveGtmContainerId() {
		if (root) {
			var a = root.getAttribute("data-gtm-id");
			if (a) return a.trim();
		}
		if (preset.gtmContainerId) return String(preset.gtmContainerId);
		return DEFAULT_GTM_CONTAINER_ID;
	}

	function resolveGaMeasurementId() {
		if (root) {
			var a = root.getAttribute("data-ga-measurement-id");
			if (a) return a.trim();
		}
		if (preset.gaMeasurementId) return String(preset.gaMeasurementId);
		return DEFAULT_GA_MEASUREMENT_ID;
	}

	function initGtm(containerId) {
		if (gtmInjected) return;
		var id = containerId || resolveGtmContainerId();
		if (!id) return;
		gtmInjected = true;
		((w, d, s, l, i) => {
			w[l] = w[l] || [];
			w[l].push({ "gtm.start": Date.now(), event: "gtm.js" });
			var f = d.getElementsByTagName(s)[0],
				j = d.createElement(s),
				dl = l !== "dataLayer" ? "&l=" + l : "";
			j.async = true;
			j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
			f.parentNode.insertBefore(j, f);
		})(window, document, "script", "dataLayer", id);
	}

	function initGtag(measurementId) {
		if (gtagInjected) return;
		var mid = measurementId || resolveGaMeasurementId();
		if (!mid) return;
		gtagInjected = true;
		var ext = document.createElement("script");
		ext.async = true;
		ext.src =
			"https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(mid);
		document.head.appendChild(ext);
		window.dataLayer = window.dataLayer || [];
		function gtag() {
			window.dataLayer.push(arguments);
		}
		window.gtag = gtag;
		gtag("js", new Date());
		gtag("config", mid);
	}

	function loadDefer(src) {
		var s = document.createElement("script");
		s.src = src;
		s.defer = true;
		document.head.appendChild(s);
	}

	function vercel() {
		window.va =
			window.va ||
			(() => {
				(window.vaq = window.vaq || []).push(arguments);
			});
		window.si =
			window.si ||
			(() => {
				(window.siq = window.siq || []).push(arguments);
			});
		if (!skipRemoteAnalyticsOnLocalDev()) {
			loadDefer("/_vercel/insights/script.js");
			loadDefer("/_vercel/speed-insights/script.js");
		}
	}

	loadAhrefsFromAttr();

	if (!heavy) {
		vercel();
		window.NABLA_SITE_ANALYTICS = {
			initGtm: initGtm,
			initGtag: initGtag,
		};
		return;
	}

	if (mode === "home") {
		initMixpanel();
	}
	initGtm();
	initGtag();

	var pc = document.createElement("link");
	pc.rel = "preconnect";
	pc.href = "https://dev.visualwebsiteoptimizer.com";
	document.head.appendChild(pc);

	/* VWO Async SmartCode */
	window._vwo_code ||
		(() => {
			var account_id = 1040791,
				version = 2.1,
				settings_tolerance = 2000,
				hide_element = "body",
				hide_element_style =
					"opacity:0 !important;filter:alpha(opacity=0) !important;background:none !important;transition:none !important;",
				/* DO NOT EDIT BELOW THIS LINE */
				f = false,
				w = window,
				d = document,
				v = root,
				cK = "_vwo_" + account_id + "_settings",
				cc = {};
			try {
				var c = JSON.parse(
					localStorage.getItem("_vwo_" + account_id + "_config"),
				);
				cc = c && typeof c === "object" ? c : {};
			} catch (_e) {}
			var stT = cc.stT === "session" ? w.sessionStorage : w.localStorage;
			code = {
				nonce: v?.nonce,
				use_existing_jquery: () =>
					typeof use_existing_jquery !== "undefined"
						? use_existing_jquery
						: undefined,
				library_tolerance: () =>
					typeof library_tolerance !== "undefined"
						? library_tolerance
						: undefined,
				settings_tolerance: () => cc.sT || settings_tolerance,
				hide_element_style: () => "{" + (cc.hES || hide_element_style) + "}",
				hide_element: () => {
					if (performance.getEntriesByName("first-contentful-paint")[0]) {
						return "";
					}
					return typeof cc.hE === "string" ? cc.hE : hide_element;
				},
				getVersion: () => version,
				finish: (e) => {
					if (!f) {
						f = true;
						var t = d.getElementById("_vis_opt_path_hides");
						if (t) t.parentNode.removeChild(t);
						if (e)
							new Image().src =
								"https://dev.visualwebsiteoptimizer.com/ee.gif?a=" +
								account_id +
								e;
					}
				},
				finished: () => f,
				addScript: (e) => {
					var t = d.createElement("script");
					t.type = "text/javascript";
					if (e.src) {
						t.src = e.src;
					} else {
						t.text = e.text;
					}
					v && t.setAttribute("nonce", v.nonce);
					d.getElementsByTagName("head")[0].appendChild(t);
				},
				load: function (e, t) {
					var n = this.getSettings(),
						i = d.createElement("script");
					t = t || {};
					if (n) {
						i.textContent = n;
						d.getElementsByTagName("head")[0].appendChild(i);
						if (!w.VWO || VWO.caE) {
							stT.removeItem(cK);
							this.load(e);
						}
					} else {
						var o = new XMLHttpRequest();
						o.open("GET", e, true);
						o.withCredentials = !t.dSC;
						o.responseType = t.responseType || "text";
						o.onload = () => {
							if (t.onloadCb) {
								return t.onloadCb(o, e);
							}
							if (o.status === 200 || o.status === 304) {
								_vwo_code.addScript({ text: o.responseText });
							} else {
								_vwo_code.finish("&e=loading_failure:" + e);
							}
						};
						o.onerror = () => {
							if (t.onerrorCb) {
								return t.onerrorCb(e);
							}
							_vwo_code.finish("&e=loading_failure:" + e);
						};
						o.send();
					}
				},
				getSettings: () => {
					try {
						var e = stT.getItem(cK);
						if (!e) {
							return;
						}
						e = JSON.parse(e);
						if (Date.now() > e.e) {
							stT.removeItem(cK);
							return;
						}
						return e.s;
					} catch (_e) {
						return;
					}
				},
				init: function () {
					if (d.URL.indexOf("__vwo_disable__") > -1) return;
					var e = this.settings_tolerance();
					w._vwo_settings_timer = setTimeout(() => {
						_vwo_code.finish();
						stT.removeItem(cK);
					}, e);
					var t;
					if (this.hide_element() !== "body") {
						t = d.createElement("style");
						var n = this.hide_element(),
							i = n ? n + this.hide_element_style() : "",
							r = d.getElementsByTagName("head")[0];
						t.setAttribute("id", "_vis_opt_path_hides");
						v && t.setAttribute("nonce", v.nonce);
						t.setAttribute("type", "text/css");
						if (t.styleSheet) t.styleSheet.cssText = i;
						else t.appendChild(d.createTextNode(i));
						r.appendChild(t);
					} else {
						t = d.getElementsByTagName("head")[0];
						var i = d.createElement("div");
						i.style.cssText =
							"z-index: 2147483647 !important;position: fixed !important;left: 0 !important;top: 0 !important;width: 100% !important;height: 100% !important;background: white !important;display: block !important;";
						i.setAttribute("id", "_vis_opt_path_hides");
						i.classList.add("_vis_hide_layer");
						t.parentNode.insertBefore(i, t.nextSibling);
					}
					var o = window._vis_opt_url || d.URL,
						s =
							"https://dev.visualwebsiteoptimizer.com/j.php?a=" +
							account_id +
							"&u=" +
							encodeURIComponent(o) +
							"&vn=" +
							version;
					if (w.location.search.indexOf("_vwo_xhr") !== -1) {
						this.addScript({ src: s });
					} else {
						this.load(s + "&x=true");
					}
				},
			};
			w._vwo_code = code;
			code.init();
		})();

	/* PostHog */
	!((t, e) => {
		var o, n, p, r;
		e.__SV ||
			((window.posthog = e),
			(e._i = []),
			(e.init = (i, s, a) => {
				function g(t, e) {
					var o = e.split(".");
					2 === o.length && ((t = t[o[0]]), (e = o[1])),
						(t[e] = (...args) => {
							t.push([e].concat(args));
						});
				}
				((p = t.createElement("script")).type = "text/javascript"),
					(p.crossOrigin = "anonymous"),
					(p.async = !0),
					(p.src =
						s.api_host.replace(".i.posthog.com", "-assets.i.posthog.com") +
						"/static/array.js"),
					(r = t.getElementsByTagName("script")[0]).parentNode.insertBefore(
						p,
						r,
					);
				var u = e;
				for (
					void 0 !== a ? (u = e[a] = []) : (a = "posthog"),
						u.people = u.people || [],
						u.toString = (t) => {
							var e = "posthog";
							return (
								"posthog" !== a && (e += "." + a), t || (e += " (stub)"), e
							);
						},
						u.people.toString = () => u.toString(1) + ".people (stub)",
						o =
							"init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug getPageViewId captureTraceFeedback captureTraceMetric".split(
								" ",
							),
						n = 0;
					n < o.length;
					n++
				)
					g(u, o[n]);
				e._i.push([i, s, a]);
			}),
			(e.__SV = 1));
	})(document, window.posthog || []);
	posthog.init("phc_IeJIEt7g86e7IWXUfcfXqhtSCxRq04PQDarTOJ9So48", {
		api_host: "https://eu.i.posthog.com",
		person_profiles: "identified_only", // or 'always' to create profiles for anonymous users as well
	});

	/* Heap */
	(window.heapReadyCb = window.heapReadyCb || []),
		(window.heap = window.heap || []),
		(heap.load = (e, t) => {
			(window.heap.envId = e),
				(window.heap.clientConfig = t = t || {}),
				(window.heap.clientConfig.shouldFetchServerConfig = !1);
			var a = document.createElement("script");
			(a.type = "text/javascript"),
				(a.async = !0),
				(a.src = "https://cdn.us.heap-api.com/config/" + e + "/heap_config.js");
			var r = document.getElementsByTagName("script")[0];
			r.parentNode.insertBefore(a, r);
			var n = [
					"init",
					"startTracking",
					"stopTracking",
					"track",
					"resetIdentity",
					"identify",
					"getSessionId",
					"getUserId",
					"getIdentity",
					"addUserProperties",
					"addEventProperties",
					"removeEventProperty",
					"clearEventProperties",
					"addAccountProperties",
					"addAdapter",
					"addTransformer",
					"addTransformerFn",
					"onReady",
					"addPageviewProperties",
					"removePageviewProperty",
					"clearPageviewProperties",
					"trackPageview",
				],
				i =
					(e) =>
					(...t) => {
						window.heapReadyCb.push({
							name: e,
							fn: () => {
								heap[e]?.apply(heap, t);
							},
						});
					};
			for (var p = 0; p < n.length; p++) heap[n[p]] = i(n[p]);
		});
	heap.load("724068705");

	/* Datadog RUM (full and home modes) */
	if (mode === "full" || mode === "home") {
		((h, o, u, n, d) => {
			h = h[d] = h[d] || {
				q: [],
				onReady: (c) => {
					h.q.push(c);
				},
			};
			d = o.createElement(u);
			d.async = 1;
			d.src = n;
			n = o.getElementsByTagName(u)[0];
			n.parentNode.insertBefore(d, n);
		})(
			window,
			document,
			"script",
			"https://www.datadoghq-browser-agent.com/eu1/v6/datadog-rum.js",
			"DD_RUM",
		);
		window.DD_RUM.onReady(() => {
			window.DD_RUM.init({
				clientToken: "pub550f242796dac3c13b730eb727658279",
				applicationId: "7308f250-2cea-49a1-b308-9a55f64375d7",
				// `site` refers to the Datadog site parameter of your organization
				// see https://docs.datadoghq.com/getting_started/site/
				site: "datadoghq.eu",
				service: "bababou",
				env: "prod",
				// Specify a version number to identify the deployed version of your application in Datadog
				version: "1.0.0",
				sessionSampleRate: 100,
				sessionReplaySampleRate: 20,
				defaultPrivacyLevel: "allow",
			});
		});
	}

	vercel();

	window.NABLA_SITE_ANALYTICS = {
		initGtm: initGtm,
		initGtag: initGtag,
	};
})();
