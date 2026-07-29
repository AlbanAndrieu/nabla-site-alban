"use client";

import React, { useEffect, useRef } from "react";

/**
 * Google Custom Search Engine widget (client-side only to prevent hydration mismatch)
 * See: https://cse.google.com/cse/
 */
const GOOGLE_CSE_SRC = "https://cse.google.com/cse.js?cx=8090719dd778f44d0";

/**
 * Note: The target div must always have the same className/id as required by CSE JS.
 */
export default function GoogleCSEClientOnly() {
	const searchedRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		// Check if the widget JS is already loaded
		if (!window.document.getElementById("gcse-script")) {
			const script = document.createElement("script");
			script.id = "gcse-script";
			script.src = GOOGLE_CSE_SRC;
			script.async = true;
			document.body.appendChild(script);
		} else {
			// If already loaded, force a re-render of widget if navigating
			window.__gcse &&
				window.__gcse.searchCallbacks &&
				window.__gcse.searchCallbacks.render &&
				window.__gcse.searchCallbacks.render();
		}
	}, []);

	return <div className="gcse-search" ref={searchedRef}></div>;
}
