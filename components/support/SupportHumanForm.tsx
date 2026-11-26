"use client";

import { type FormEvent, useId, useState } from "react";
import Button from "@/components/ui/Button";
import {
	fitSupportHistory,
	SUPPORT_LIMITS,
	type SupportLocale,
	type SupportMessage,
} from "@/lib/supportChat";
import type { SupportChatCopy } from "./SupportChat";
import styles from "./SupportChat.module.css";

const FALLBACK_EMAIL = "openclaw@albandrieu.com";

/** "Talk to a human": posts to /api/support-contact, mailto when that fails. */
export default function SupportHumanForm({
	copy,
	locale,
	transcript,
	open,
	onOpenChange,
	waitingForToken,
	takeToken,
}: {
	copy: SupportChatCopy;
	locale: SupportLocale;
	transcript: SupportMessage[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
	waitingForToken: boolean;
	takeToken: () => string | undefined;
}) {
	const id = useId();
	const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">(
		"idle",
	);

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = event.currentTarget;
		const data = new FormData(form);
		const message = String(data.get("message") ?? "").trim();
		const email = String(data.get("email") ?? "").trim();
		if (!message || state === "sending" || waitingForToken) return;
		setState("sending");
		try {
			const response = await fetch("/api/support-contact", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					message,
					email: email || undefined,
					transcript: fitSupportHistory(transcript),
					locale,
					turnstileToken: takeToken(),
				}),
			});
			setState(response.status === 202 ? "sent" : "failed");
			if (response.status === 202) form.reset();
		} catch {
			setState("failed");
		}
	}

	return (
		<details
			className={styles.human}
			open={open}
			onToggle={(event) => onOpenChange(event.currentTarget.open)}
		>
			<summary>{copy.humanTitle}</summary>
			<p>{copy.humanIntro}</p>
			<form onSubmit={submit}>
				<label htmlFor={`${id}-message`} className="form-label">
					{copy.messageLabel}
				</label>
				<textarea
					id={`${id}-message`}
					name="message"
					className="form-control mb-3"
					rows={4}
					maxLength={SUPPORT_LIMITS.maxContentChars}
					required
				/>
				<label htmlFor={`${id}-email`} className="form-label">
					{copy.emailLabel}
				</label>
				<input
					id={`${id}-email`}
					name="email"
					type="email"
					autoComplete="email"
					className="form-control"
					maxLength={SUPPORT_LIMITS.maxEmailChars}
				/>
				<div className={styles.actions}>
					<Button
						type="submit"
						variant="secondary"
						disabled={state === "sending" || waitingForToken}
					>
						{state === "sending"
							? copy.humanSending
							: waitingForToken
								? copy.verifying
								: copy.humanSend}
					</Button>
				</div>
			</form>
			{state === "sent" ? (
				<p role="status" className="alert alert-success mt-3 mb-0">
					{copy.humanSent}
				</p>
			) : null}
			{state === "failed" ? (
				<p role="alert" className="alert alert-warning mt-3 mb-0">
					{copy.humanFailed}{" "}
					<a href={`mailto:${FALLBACK_EMAIL}`}>{FALLBACK_EMAIL}</a>.
				</p>
			) : null}
		</details>
	);
}
