"use client";
import { useCallback, useEffect, useState } from "react";

const FEEDS_CONFIG_URL = "/ciso-rss-feeds.json";
const FEED_CONCURRENCY = 8;
const MAX_VISIBLE_ITEMS = 24;

type FeedItem = {
  link: string;
  pubDate?: string;
  source: string;
  title: string;
};

type Labels = {
  loading?: string;
  error?: string;
  retry?: string;
  opensInNewTab?: string;
};

function safeExternalUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function safeFeedUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value.replaceAll("&", "&"));
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

async function loadFeedUrls(signal?: AbortSignal): Promise<string[]> {
  const response = await fetch(FEEDS_CONFIG_URL, { signal });
  if (!response.ok) {
    throw new Error(`RSS configuration request failed: ${response.status}`);
  }

  const data = (await response.json()) as { feeds?: unknown };
  if (!Array.isArray(data.feeds)) {
    throw new Error("RSS configuration does not contain a feeds array");
  }

  return Array.from(
    new Set(data.feeds.flatMap((value) => safeFeedUrl(value) ?? [])),
  );
}

async function fetchFeed(
  feedUrl: string,
  signal?: AbortSignal,
): Promise<FeedItem[]> {
  const endpoint = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
  const response = await fetch(endpoint, { signal });
  if (!response.ok) throw new Error(`RSS request failed: ${response.status}`);

  const data = (await response.json()) as {
    feed?: { title?: string };
    items?: Array<{ link?: unknown; pubDate?: string; title?: unknown }>;
  };

  return (data.items ?? []).slice(0, 2).flatMap((item) => {
    const link = safeExternalUrl(item.link);
    if (!link || typeof item.title !== "string" || !item.title.trim())
      return [];
    return [
      {
        link,
        pubDate: item.pubDate,
        source: data.feed?.title ?? new URL(feedUrl).hostname,
        title: item.title.trim(),
      },
    ];
  });
}

async function fetchFeedsWithLimit(feedUrls: string[], signal?: AbortSignal) {
  const collected: FeedItem[] = [];
  let nextIndex = 0;

  async function worker() {
    while (!signal?.aborted) {
      const index = nextIndex++;
      if (index >= feedUrls.length) return;
      try {
        collected.push(...(await fetchFeed(feedUrls[index], signal)));
      } catch {
        // A stale or unavailable source must not hide healthy feeds.
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(FEED_CONCURRENCY, feedUrls.length) }, () =>
      worker(),
    ),
  );

  return Array.from(
    new Map(collected.map((item) => [item.link, item])).values(),
  )
    .sort((a, b) => Date.parse(b.pubDate ?? "") - Date.parse(a.pubDate ?? ""))
    .slice(0, MAX_VISIBLE_ITEMS);
}

function formatFeedDate(value: string | undefined, locale: "en" | "fr") {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return {
    dateTime: date.toISOString(),
    label: new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
      date,
    ),
  };
}

export default function ThreatFeed({
  locale,
  labels = {},
}: {
  locale: "en" | "fr";
  labels?: Labels;
}) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  const defaultLabels: Required<Labels> = {
    loading:
      locale === "fr"
        ? "Chargement des actualités de sécurité…"
        : "Loading security news…",
    error:
      locale === "fr"
        ? "Les flux sont temporairement indisponibles."
        : "Threat feeds are temporarily unavailable.",
    retry: locale === "fr" ? "Réessayer" : "Retry",
    opensInNewTab: locale === "fr" ? "nouvel onglet" : "opens in a new tab",
  };
  const usedLabels = { ...defaultLabels, ...labels };

  const loadFeeds = useCallback(async (signal?: AbortSignal) => {
    setStatus("loading");
    try {
      const feedUrls = await loadFeedUrls(signal);
      const nextItems = await fetchFeedsWithLimit(feedUrls, signal);
      if (signal?.aborted) return;
      setItems(nextItems);
      setStatus(nextItems.length ? "ready" : "error");
    } catch {
      if (!signal?.aborted) setStatus("error");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadFeeds(controller.signal);
    const refresh = window.setInterval(
      () => void loadFeeds(controller.signal),
      600_000,
    );
    return () => {
      controller.abort();
      window.clearInterval(refresh);
    };
  }, [loadFeeds]);

  if (status === "loading" && !items.length) {
    return (
      <p className="ciso-feed-status" role="status">
        {usedLabels.loading}
      </p>
    );
  }
  if (status === "error") {
    return (
      <div className="ciso-feed-status" role="alert">
        <p>{usedLabels.error}</p>
        <button
          className="btn btn-outline-primary btn-sm"
          type="button"
          onClick={() => void loadFeeds()}
        >
          {usedLabels.retry}
        </button>
      </div>
    );
  }

  return (
    <div className="ciso-feed-list">
      {items.map((item) => {
        const date = formatFeedDate(item.pubDate, locale);
        return (
          <article
            className="ciso-feed-item"
            key={`${item.source}-${item.link}`}
          >
            <p className="ciso-feed-meta">
              <i className="fa-solid fa-rss" aria-hidden="true" /> {item.source}
              {date ? (
                <>
                  {" "}
                  · <time dateTime={date.dateTime}>{date.label}</time>
                </>
              ) : null}
            </p>
            <h3>
              <a href={item.link} target="_blank" rel="noopener noreferrer">
                {item.title}
                <span className="visually-hidden">
                  ({usedLabels.opensInNewTab})
                </span>
              </a>
            </h3>
          </article>
        );
      })}
    </div>
  );
}
