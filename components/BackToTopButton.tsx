"use client";

type BackToTopButtonProps = {
	label: string;
	ariaLabel: string;
	className?: string;
};

export default function BackToTopButton({
	label,
	ariaLabel,
	className,
}: BackToTopButtonProps) {
	const handleClick = () => {
		const prefersReducedMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;
		window.scrollTo({
			top: 0,
			left: 0,
			behavior: prefersReducedMotion ? "auto" : "smooth",
		});
		window.history.replaceState(
			null,
			"",
			`${window.location.pathname}${window.location.search}#top`,
		);
	};

	return (
		<button
			type="button"
			className={className}
			aria-label={ariaLabel}
			onClick={handleClick}
		>
			<i className="fas fa-arrow-up" aria-hidden="true"></i>
			<span>{label}</span>
		</button>
	);
}
