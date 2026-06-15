"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type ThreadRecommendation = {
  postID: string;
  score: number;
  reason: string;
  title: string;
  forum: string;
};

type ForumRecommendation = {
  forumID: string;
  slug: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  score: number;
  reason: string;
};

type AiRecommendProps = {
  variant?: "threads" | "forums";
  title?: string;
  className?: string;
  paginated?: boolean;
  limit?: number;
  /** Delay initial fetch so multiple widgets do not hit Ollama at once */
  deferMs?: number;
  /** Skip Ollama and use instant profile-based suggestions */
  heuristicOnly?: boolean;
};

async function fetchRecommendJson(url: string) {
  const res = await fetch(url);
  const data = await res.json();
  if (res.ok) return data;

  const fallbackUrl = url.includes("heuristic=1")
    ? url
    : `${url}${url.includes("?") ? "&" : "?"}heuristic=1`;
  const fallbackRes = await fetch(fallbackUrl);
  const fallbackData = await fallbackRes.json();
  if (fallbackRes.ok) {
    return { ...fallbackData, fallback: true };
  }

  throw new Error(fallbackData?.error?.message || data?.error?.message || "Could not load recommendations");
}

function ThreadCard({ item }: { item: ThreadRecommendation }) {
  return (
    <Link
      href={`/post/${item.postID}`}
      className="block rounded-xl border border-gray-100 p-3 hover:border-violet-200 hover:bg-violet-50 transition"
    >
      <p className="text-sm font-medium text-gray-800 line-clamp-2">{item.title}</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <span className="text-[10px] text-gray-400">{item.forum}</span>
        <span className="text-[10px] text-violet-500">{item.reason}</span>
      </div>
    </Link>
  );
}

function ForumCard({ item, compact = false }: { item: ForumRecommendation; compact?: boolean }) {
  return (
    <Link
      href={`/forums/${item.slug}`}
      className={`block rounded-xl border border-gray-100 transition hover:border-teal-200 hover:bg-teal-50 ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`shrink-0 rounded-xl flex items-center justify-center text-white font-bold ${
            compact ? "w-10 h-10 text-sm" : "w-12 h-12"
          }`}
          style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)" }}
        >
          {item.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className={`font-semibold text-gray-900 line-clamp-1 ${compact ? "text-sm" : "text-base"}`}>
            {item.name}
          </p>
          <p className="mt-1 text-xs text-gray-500 line-clamp-2">{item.description || item.reason}</p>
          <p className="mt-1 text-[10px] text-teal-600">{item.reason}</p>
        </div>
      </div>
    </Link>
  );
}

export function AiRecommend({
  variant = "threads",
  title,
  className = "",
  paginated = false,
  limit = 5,
  deferMs = 0,
  heuristicOnly = false,
}: AiRecommendProps) {
  const [threadItems, setThreadItems] = useState<ThreadRecommendation[]>([]);
  const [forumItems, setForumItems] = useState<ForumRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);

  const endpoint =
    variant === "forums"
      ? `/api/ai/recommend/forums${heuristicOnly ? "?heuristic=1" : ""}`
      : `/api/ai/recommend?limit=${limit}${heuristicOnly ? "&heuristic=1" : ""}`;

  const loadThreads = useCallback(
    async (nextPage: number, append: boolean) => {
      const heuristicQuery = heuristicOnly ? "&heuristic=1" : "";
      const data = await fetchRecommendJson(
        `/api/ai/recommend?page=${nextPage}&limit=${limit}${heuristicQuery}`
      );

      const incoming = (data.recommendations ?? []) as ThreadRecommendation[];
      setThreadItems((prev) => (append ? [...prev, ...incoming] : incoming));
      setHasMore(Boolean(data.hasMore));
      setPage(nextPage);
      if (data.fallback) setUsedFallback(true);
    },
    [heuristicOnly, limit]
  );

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      setLoading(true);
      setError("");
      setUsedFallback(false);
      try {
        if (variant === "forums") {
          const data = await fetchRecommendJson(endpoint);
          if (!ignore) {
            setForumItems(data.recommendations ?? []);
            setUsedFallback(Boolean(data.fallback));
          }
        } else {
          await loadThreads(1, false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Could not load recommendations");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    const deferTimer = setTimeout(() => {
      void load();
    }, deferMs);

    return () => {
      ignore = true;
      clearTimeout(deferTimer);
    };
  }, [deferMs, endpoint, heuristicOnly, loadThreads, variant]);

  const loadMore = async () => {
    if (!paginated || !hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      await loadThreads(page + 1, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load more");
    } finally {
      setLoadingMore(false);
    }
  };

  const badgeLabel = usedFallback ? "Suggested" : "AI";
  const badgeClass =
    variant === "forums"
      ? usedFallback
        ? "bg-gray-100 text-gray-600"
        : "bg-teal-100 text-teal-700"
      : usedFallback
        ? "bg-gray-100 text-gray-600"
        : "bg-violet-100 text-violet-700";

  const heading =
    title ??
    (variant === "forums" ? "You might like this forum!" : "Recommended for you");

  if (loading) {
    return (
      <div className={`rounded-2xl border border-gray-100 bg-white p-5 ${className}`}>
        <p className="text-xs text-violet-600 animate-pulse">✦ Loading recommendations…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-2xl border border-gray-100 bg-white p-5 ${className}`}>
        <p className="text-xs text-gray-500">{error}</p>
      </div>
    );
  }

  if (variant === "forums") {
    if (forumItems.length === 0) return null;

    return (
      <div className={`rounded-2xl border border-teal-100 bg-white p-5 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-semibold text-gray-700">{heading}</span>
          <span className={`rounded px-1.5 py-0.5 text-[10px] ${badgeClass}`}>{badgeLabel}</span>
        </div>
        <div className="space-y-3">
          {forumItems.map((item) => (
            <ForumCard key={item.forumID} item={item} compact />
          ))}
        </div>
      </div>
    );
  }

  if (threadItems.length === 0) return null;

  return (
    <div className={`rounded-2xl border border-violet-100 bg-white p-5 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-semibold text-gray-700">{heading}</span>
        <span className={`rounded px-1.5 py-0.5 text-[10px] ${badgeClass}`}>{badgeLabel}</span>
      </div>
      <div className={`space-y-3 ${paginated ? "max-h-112 overflow-y-auto pr-1" : ""}`}>
        {threadItems.map((item) => (
          <ThreadCard key={`${item.postID}-${item.title}`} item={item} />
        ))}
      </div>
      {paginated && hasMore && (
        <button
          type="button"
          onClick={() => void loadMore()}
          disabled={loadingMore}
          className="mt-4 w-full rounded-xl border border-violet-200 px-3 py-2 text-xs font-medium text-violet-700 hover:bg-violet-50 disabled:opacity-60"
        >
          {loadingMore ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
}
