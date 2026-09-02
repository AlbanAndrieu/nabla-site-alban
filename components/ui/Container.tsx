import type { ComponentPropsWithoutRef } from "react";
import styles from "./Container.module.css";

type ContainerProps = ComponentPropsWithoutRef<"div">;

export default function Container({ className, ...props }: ContainerProps) {
	const classes = [styles.container, className].filter(Boolean).join(" ");

	return <div className={classes} {...props} />;
}
