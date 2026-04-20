/**
 * @deprecated Use `<script src="/site-analytics.js" data-analytics-mode="vercel"></script>` in the document.
 * Kept so old pages that still reference this file keep working (dynamic inject: no document.currentScript).
 */
window.NABLA_ANALYTICS_MODE = "vercel";
(() => {
	var s = document.createElement("script");
	s.src = "/site-analytics.js";
	(document.head || document.documentElement).appendChild(s);
})();
