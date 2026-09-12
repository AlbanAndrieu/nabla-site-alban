import type { ComponentPropsWithoutRef } from "react";
import styles from "./Badge.module.css";

export type BadgeVariant = "info" | "success" | "primary";

type BadgeProps = ComponentPropsWithoutRef<"span"> & {
	variant?: BadgeVariant;
};

export default function Badge({
	className,
	variant = "primary",
	...props
}: BadgeProps) {
	return (
		<span
			{...props}
			className={[styles.badge, styles[variant], className]
				.filter(Boolean)
				.join(" ")}
		/>
	);
}
