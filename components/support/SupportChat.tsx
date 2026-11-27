"use client";

import Script from "next/script";
import {
	type KeyboardEvent,
	useCallback,
	useEffect,
	useId,
	useRef,
	useState,
} from "react";
import Button from "@/components/ui/Button";
import {
	fitSupportHistory,
	SUPPORT_LIMITS,
	type SupportLocale,
	type SupportMessage,
	stripCitationMarkers,
} from "@/lib/supportChat";
import styles from "./SupportChat.module.css";
import SupportHumanForm from "./SupportHumanForm";

export type SupportChatCopy = {
	logLabel: string;
	empty: string;
	you: string;
	assistant: string;
	inputLabel: string;
	inputHint: string;
	send: string;
	sending: string;
	verifying: string;
	unavailable: string;
	verifyFailed: string;
	humanTitle: string;
	humanIntro: string;
	messageLabel: string;
	emailLabel: string;
	humanSend: string;
	humanSending: string;
	humanSent: string;
	humanFailed: string;
};

type TurnstileApi = {
	render(element: HTMLElement, options: Record<string, unknown>): string;
	reset(widgetId: string): void;
	remove(widgetId: string): void;
};

declare global {
	interface Window {
		turnstile?: TurnstileApi;
	}
}

type Turn = SupportMessage & { id: number };

export default function SupportChat({
	copy,
	locale,
	turnstileSiteKey,
}: {
	copy: SupportChatCopy;
	locale: SupportLocale;
	turnstileSiteKey?: string;
}) {
	const id = useId();
	const [turns, setTurns] = useState<Turn[]>([]);
	const [draft, setDraft] = useState("");
	const [streaming, setStreaming] = useState(false);
	const [error, setError] = useState<"unavailable" | "verifyFailed" | null>(
		null,
	);
	const [humanOpen, setHumanOpen] = useState(false);
	const [token, setToken] = useState<string | null>(null);
	const nextId = useRef(0);
	const widgetElement = useRef<HTMLDivElement>(null);
	const widgetId = useRef<string | null>(null);

	const renderWidget = useCallback(() => {
		if (!turnstileSiteKey || !widgetElement.current || widgetId.current) return;
		if (!window.turnstile) return;
		widgetId.current = window.turnstile.render(widgetElement.current, {
			sitekey: turnstileSiteKey,
			language: locale,
			callback: (value: string) => setToken(value),
			"expired-callback": () => setToken(null),
			"error-callback": () => setToken(null),
		});
	}, [turnstileSiteKey, locale]);

	useEffect(() => {
		// Covers client-side navigation back here once the script is cached.
		renderWidget();
		return () => {
			if (widgetId.current) window.turnstile?.remove(widgetId.current);
			widgetId.current = null;
		};
	}, [renderWidget]);

	const waitingForToken = Boolean(turnstileSiteKey) && !token;

	/** Turnstile tokens are single-use: hand one out, then reset the widget. */
	function takeToken(): string | undefined {
		const current = token ?? undefined;
		setToken(null);
		if (widgetId.current) window.turnstile?.reset(widgetId.current);
		return current;
	}

	const turn = (role: Turn["role"], content: string): Turn => {
		nextId.current += 1;
		return { id: nextId.current, role, content };
	};

	async function send() {
		const content = draft.trim();
		if (!content || streaming || waitingForToken) return;
		const shown = [...turns, turn("user", content)];
		const answerTurn = turn("assistant", "");
		setTurns([...shown, answerTurn]);
		setDraft("");
		setError(null);
		setStreaming(true);
		let answer = "";
		try {
			const response = await fetch("/api/support-chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					messages: fitSupportHistory(shown),
					locale,
					turnstileToken: takeToken(),
				}),
			});
			if (!response.ok || !response.body) {
				throw new Error(
					response.status === 403 ? "verifyFailed" : "unavailable",
				);
			}
			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			for (;;) {
				const { value, done } = await reader.read();
				if (done) break;
				answer += decoder.decode(value, { stream: true });
				setTurns([...shown, { ...answerTurn, content: answer }]);
			}
			answer += decoder.decode();
			if (!answer.trim()) throw new Error("unavailable");
			setTurns([...shown, { ...answerTurn, content: answer }]);
		} catch (caught) {
			// Keep a partial answer; drop the empty placeholder.
			setTurns(
				answer.trim() ? [...shown, { ...answerTurn, content: answer }] : shown,
			);
			setError(
				caught instanceof Error && caught.message === "verifyFailed"
					? "verifyFailed"
					: "unavailable",
			);
			setHumanOpen(true);
		} finally {
			setStreaming(false);
		}
	}

	function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
		if (
			event.key !== "Enter" ||
			event.shiftKey ||
			event.nativeEvent.isComposing
		)
			return;
		event.preventDefault();
		void send();
	}

	return (
		<>
			{turnstileSiteKey ? (
				<Script
					src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
					strategy="afterInteractive"
					onReady={renderWidget}
				/>
			) : null}
			{turns.length === 0 ? (
				<p className="text-secondary">{copy.empty}</p>
			) : null}
			{/* Always mounted so the first answer is announced; aria-busy defers
			    the announcement until streaming ends. */}
			<ol
				className={styles.log}
				aria-live="polite"
				aria-busy={streaming}
				aria-label={copy.logLabel}
			>
				{turns.map((item) => (
					<li key={item.id} className={styles.turn}>
						<strong>{item.role === "user" ? copy.you : copy.assistant}</strong>
						<p className={styles.text}>
							{stripCitationMarkers(item.content) || copy.sending}
						</p>
					</li>
				))}
			</ol>
			<form
				onSubmit={(event) => {
					event.preventDefault();
					void send();
				}}
				aria-busy={streaming}
			>
				<label htmlFor={`${id}-question`} className="form-label">
					{copy.inputLabel}
				</label>
				<textarea
					id={`${id}-question`}
					className="form-control"
					rows={3}
					maxLength={SUPPORT_LIMITS.maxContentChars}
					value={draft}
					onChange={(event) => setDraft(event.target.value)}
					onKeyDown={onKeyDown}
					aria-describedby={`${id}-hint`}
					required
				/>
				<p id={`${id}-hint`} className="form-text">
					{copy.inputHint}
				</p>
				<div ref={widgetElement} />
				<div className={styles.actions}>
					<Button
						type="submit"
						disabled={streaming || waitingForToken || !draft.trim()}
					>
						{streaming
							? copy.sending
							: waitingForToken
								? copy.verifying
								: copy.send}
					</Button>
				</div>
			</form>
			{error ? (
				<p role="alert" className="alert alert-warning mt-3 mb-0">
					{copy[error]}
				</p>
			) : null}
			<SupportHumanForm
				copy={copy}
				locale={locale}
				transcript={turns}
				open={humanOpen}
				onOpenChange={setHumanOpen}
				waitingForToken={waitingForToken}
				takeToken={takeToken}
			/>
		</>
	);
}
