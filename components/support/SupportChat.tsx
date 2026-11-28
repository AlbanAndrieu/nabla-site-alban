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
	supportCitationSegments,
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
	paused: string;
	rateLimited: string;
	ratingHelpful: string;
	ratingNotHelpful: string;
	ratingRecorded: string;
	ratingFailed: string;
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

type Turn = SupportMessage & {
	id: number;
	traceId?: string;
	feedbackToken?: string;
};

export default function SupportChat({
	copy,
	locale,
	turnstileSiteKey,
	enabled = true,
}: {
	copy: SupportChatCopy;
	locale: SupportLocale;
	turnstileSiteKey?: string;
	enabled?: boolean;
}) {
	const id = useId();
	const [turns, setTurns] = useState<Turn[]>([]);
	const [draft, setDraft] = useState("");
	const [streaming, setStreaming] = useState(false);
	const [error, setError] = useState<"unavailable" | "verifyFailed" | "rateLimited" | null>(
		null,
	);
	const [ratings, setRatings] = useState<Record<number, "up" | "down" | "sending">>({});
	const [ratingErrors, setRatingErrors] = useState<Record<number, boolean>>({});
	const [humanOpen, setHumanOpen] = useState(!enabled);
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
		if (!enabled || !content || streaming || waitingForToken) return;
		const shown = [...turns, turn("user", content)];
		const answerTurn = turn("assistant", "");
		let annotatedAnswer = answerTurn;
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
					response.status === 403
						? "verifyFailed"
						: response.status === 429
							? "rateLimited"
							: "unavailable",
				);
			}
			const traceId = response.headers.get("X-Support-Trace-Id");
			const feedbackToken = response.headers.get("X-Support-Feedback-Token");
			if (traceId && feedbackToken) {
				annotatedAnswer = { ...answerTurn, traceId, feedbackToken };
			}
			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			for (;;) {
				const { value, done } = await reader.read();
				if (done) break;
				answer += decoder.decode(value, { stream: true });
				setTurns([...shown, { ...annotatedAnswer, content: answer }]);
			}
			answer += decoder.decode();
			if (!answer.trim()) throw new Error("unavailable");
			setTurns([...shown, { ...annotatedAnswer, content: answer }]);
		} catch (caught) {
			// Keep a partial answer; drop the empty placeholder.
			setTurns(
				answer.trim() ? [...shown, { ...annotatedAnswer, content: answer }] : shown,
			);
			setError(
				caught instanceof Error && caught.message === "verifyFailed"
					? "verifyFailed"
					: caught instanceof Error && caught.message === "rateLimited"
						? "rateLimited"
						: "unavailable",
			);
			setHumanOpen(true);
		} finally {
			setStreaming(false);
		}
	}

	async function rate(item: Turn, relevant: boolean) {
		if (!item.traceId || !item.feedbackToken || ratings[item.id]) return;
		setRatings((current) => ({ ...current, [item.id]: "sending" }));
		setRatingErrors((current) => ({ ...current, [item.id]: false }));
		try {
			const response = await fetch("/api/support-feedback", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					traceId: item.traceId,
					token: item.feedbackToken,
					relevant,
				}),
			});
			if (response.status !== 202) throw new Error("rating_unavailable");
			setRatings((current) => ({
				...current,
				[item.id]: relevant ? "up" : "down",
			}));
		} catch {
			setRatings((current) => {
				const next = { ...current };
				delete next[item.id];
				return next;
			});
			setRatingErrors((current) => ({ ...current, [item.id]: true }));
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
			{!enabled ? <p role="status" className="alert alert-warning">{copy.paused}</p> : null}
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
							{item.content
								? supportCitationSegments(item.content).map((part, index) =>
										part.href ? (
											<a
												key={index}
												href={part.href}
												target="_blank"
												rel="noopener noreferrer"
											>
												{part.text}
											</a>
										) : (
											<span key={index}>{part.text}</span>
										),
									)
								: copy.sending}
						</p>
						{item.role === "assistant" && item.feedbackToken && item.traceId && !(
							streaming && turns.at(-1)?.id === item.id
						) ? (
							<div className={styles.rating}>
								<button
									type="button"
									aria-label={copy.ratingHelpful}
									aria-pressed={ratings[item.id] === "up"}
									disabled={Boolean(ratings[item.id])}
									onClick={() => void rate(item, true)}
								>👍</button>
								<button
									type="button"
									aria-label={copy.ratingNotHelpful}
									aria-pressed={ratings[item.id] === "down"}
									disabled={Boolean(ratings[item.id])}
									onClick={() => void rate(item, false)}
								>👎</button>
								{ratings[item.id] === "up" || ratings[item.id] === "down" ? (
									<span role="status">{copy.ratingRecorded}</span>
								) : null}
								{ratingErrors[item.id] ? (
									<span role="alert">{copy.ratingFailed}</span>
								) : null}
							</div>
						) : null}
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
						disabled={!enabled || streaming || waitingForToken || !draft.trim()}
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
