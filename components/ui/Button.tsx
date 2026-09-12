import type { ComponentPropsWithoutRef } from "react";
import {
	type ActionSize,
	type ActionVariant,
	actionClassName,
} from "./ActionLink";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
	variant?: ActionVariant;
	size?: ActionSize;
};

export default function Button({
	variant = "primary",
	size = "default",
	className,
	type = "button",
	...props
}: ButtonProps) {
	return (
		<button
			{...props}
			type={type}
			className={actionClassName(variant, size, className)}
		/>
	);
}
