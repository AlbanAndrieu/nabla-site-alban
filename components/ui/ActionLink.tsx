import type { ComponentPropsWithoutRef } from "react";
import styles from "./Action.module.css";

type ActionVariant = "primary" | "secondary" | "outline";
type ActionSize = "default" | "compact";

type ActionLinkProps = ComponentPropsWithoutRef<"a"> & {
	variant?: ActionVariant;
	size?: ActionSize;
};

export function actionClassName(variant: ActionVariant = "primary") {
	return `${styles.action} ${styles[variant]}`;
}

export default function ActionLink({
	variant = "primary",
	size = "default",
	className,
	...props
}: ActionLinkProps) {
	const classes = [
		actionClassName(variant),
		size === "compact" ? styles.compact : undefined,
		className,
	]
		.filter(Boolean)
		.join(" ");

	return <a {...props} className={classes} />;
}
