"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Recommendation = {
  postID: string;
  score: number;
  reason: string;
  title: string;
  forum: string;
};

export function AiRecommend() {
  const [items, setItems] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/ai/recommend")
      .then((r) => r.json())
      .then((d: { recommendations?: Recommendation[] }) => {
        setItems(d.recommendations ?? []);
      })
      .catch(() => setError("Could not load recommendations"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <p className="text-xs text-violet-600 animate-pulse">✦ Loading recommendations…</p>
      </div>
    );
  }

  if (error || items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-semibold text-gray-700">✦ Recommended for you</span>
        <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] text-violet-700">AI</span>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <Link
            key={item.postID}
            href={`/post/${item.postID}`}
            className="block rounded-xl border border-gray-100 p-3 hover:border-violet-200 hover:bg-violet-50 transition"
          >
            <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.title}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[10px] text-gray-400">{item.forum}</span>
              <span className="text-[10px] text-violet-500">{item.reason}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
