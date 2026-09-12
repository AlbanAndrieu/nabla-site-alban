import type { ComponentPropsWithoutRef } from "react";
import styles from "./Action.module.css";

export type ActionVariant =
	| "primary"
	| "secondary"
	| "outline"
	| "outlineSecondary"
	| "inverted";
export type ActionSize = "default" | "compact";

type ActionLinkProps = ComponentPropsWithoutRef<"a"> & {
	variant?: ActionVariant;
	size?: ActionSize;
};

export function actionClassName(
	variant: ActionVariant = "primary",
	size: ActionSize = "default",
	className?: string,
) {
	return [
		styles.action,
		styles[variant],
		size === "compact" ? styles.compact : undefined,
		className,
	]
		.filter(Boolean)
		.join(" ");
}

export default function ActionLink({
	variant = "primary",
	size = "default",
	className,
	...props
}: ActionLinkProps) {
	return <a {...props} className={actionClassName(variant, size, className)} />;
}
