import type { ComponentPropsWithoutRef } from "react";
import styles from "./Card.module.css";

type CardProps = ComponentPropsWithoutRef<"div"> & {
	borderless?: boolean;
	elevated?: boolean;
};

type CardBodyProps = ComponentPropsWithoutRef<"div">;

function classes(...values: Array<string | false | null | undefined>) {
	return values.filter(Boolean).join(" ");
}

export default function Card({
	borderless = false,
	className,
	elevated = false,
	...props
}: CardProps) {
	return (
		<div
			className={classes(
				styles.card,
				elevated && styles.elevated,
				borderless && styles.borderless,
				className,
			)}
			{...props}
		/>
	);
}

export function CardBody({ className, ...props }: CardBodyProps) {
	return <div className={classes(styles.body, className)} {...props} />;
}
