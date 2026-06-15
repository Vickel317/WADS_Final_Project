"use client";

import { useEffect, useState } from "react";

type LikeButtonProps = {
  postId: string;
};

export default function LikeButton({ postId }: LikeButtonProps) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/posts/${postId}/like`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        setLiked(Boolean(data.liked));
        setCount(typeof data.count === "number" ? data.count : 0);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [postId]);

  const toggleLike = async () => {
    if (pending || loading) return;
    setPending(true);
    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to update like");
      }
      setLiked(Boolean(data.liked));
      setCount(typeof data.count === "number" ? data.count : 0);
    } catch {
      // ignore — state stays unchanged
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleLike}
      disabled={loading || pending}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:opacity-60 ${
        liked
          ? "border-teal-200 bg-teal-50 text-teal-700"
          : "border-gray-200 bg-white text-gray-500 hover:border-teal-200 hover:text-teal-700"
      }`}
      aria-pressed={liked}
    >
      <svg
        className="h-4 w-4"
        fill={liked ? "currentColor" : "none"}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
        />
      </svg>
      {loading ? "…" : `${count} like${count === 1 ? "" : "s"}`}
    </button>
  );
}
