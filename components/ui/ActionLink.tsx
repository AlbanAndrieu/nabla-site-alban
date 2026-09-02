import type { ComponentPropsWithoutRef } from "react";
import styles from "./Action.module.css";

type ActionVariant = "primary" | "secondary" | "outline";

type ActionLinkProps = ComponentPropsWithoutRef<"a"> & {
	variant?: ActionVariant;
};

export function actionClassName(variant: ActionVariant = "primary") {
	return `${styles.action} ${styles[variant]}`;
}

export default function ActionLink({
	variant = "primary",
	className,
	...props
}: ActionLinkProps) {
	const classes = [actionClassName(variant), className].filter(Boolean).join(" ");

	return <a {...props} className={classes} />;
}
