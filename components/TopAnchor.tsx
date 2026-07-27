"use client";
import { useId } from "react";

export default function TopAnchor() {
	const topId = useId();
	return <div id={topId} data-role="top-anchor" />;
}
