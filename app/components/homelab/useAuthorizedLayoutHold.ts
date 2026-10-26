"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Preserve layout during a fail-closed access recheck without retaining OWNER
 * markup or telemetry in the DOM, storage or public browser cache.
 */
export default function useAuthorizedLayoutHold(visible: boolean) {
  const regionRef = useRef<HTMLDivElement | null>(null);
  const [reservedHeight, setReservedHeight] = useState(0);

  useEffect(() => {
    const node = visible ? regionRef.current : null;
    if (!node) return;

    const measure = () => {
      const height = Math.ceil(node.getBoundingClientRect().height);
      if (Number.isFinite(height) && height > 0) {
        setReservedHeight((old) => old === height ? old : height);
      }
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return { regionRef, reservedHeight };
}
