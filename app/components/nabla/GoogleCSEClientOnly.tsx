"use client";

import { useEffect, useRef } from "react";

/**
 * Google Custom Search Engine widget (client-side only to prevent hydration mismatch)
 * See: https://cse.google.com/cse/
 */
const GOOGLE_CSE_SRC = "https://cse.google.com/cse.js?cx=8090719dd778f44d0";

/**
 * Note: The target div must always have the same className/id as required by CSE JS.
 */
export default function GoogleCSEClientOnly() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // CSE replaces and mutates its target. Create it imperatively inside an
    // outer node owned by React so those mutations never enter reconciliation.
    const searchTarget = document.createElement("div");
    searchTarget.className = "gcse-search";
    container.replaceChildren(searchTarget);

    // Check if the widget JS is already loaded
    if (!window.document.getElementById("gcse-script")) {
      const script = document.createElement("script");
      script.id = "gcse-script";
      script.src = GOOGLE_CSE_SRC;
      script.async = true;
      document.body.appendChild(script);
    } else {
      // If already loaded, force a re-render of widget if navigating
      const googleCse = (
        window as Window & {
          __gcse?: { searchCallbacks?: { render?: () => void } };
        }
      ).__gcse;
      googleCse?.searchCallbacks?.render?.();
    }
  }, []);

  return <div ref={containerRef} />;
}
