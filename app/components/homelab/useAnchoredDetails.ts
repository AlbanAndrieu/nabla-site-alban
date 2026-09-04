"use client";

import { useCallback, useEffect, useState } from "react";

export default function useAnchoredDetails(
	id: string,
	available = true,
): {
	open: boolean;
	setOpen: (open: boolean) => void;
	reveal: (behavior?: ScrollBehavior) => void;
} {
	const [open, setOpen] = useState(false);

	const reveal = useCallback(
		(behavior: ScrollBehavior = "auto") => {
			setOpen(true);
			window.requestAnimationFrame(() => {
				document.getElementById(id)?.scrollIntoView({
					block: "start",
					behavior,
				});
			});
		},
		[id],
	);

	useEffect(() => {
		if (!available) return;

		const revealWhenTargeted = () => {
			if (window.location.hash === `#${id}`) reveal();
		};

		revealWhenTargeted();
		window.addEventListener("hashchange", revealWhenTargeted);
		return () => window.removeEventListener("hashchange", revealWhenTargeted);
	}, [available, id, reveal]);

	return { open, setOpen, reveal };
}
