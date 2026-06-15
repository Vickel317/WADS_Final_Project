"use client";

import { useEffect, useState } from "react";

export default function CommentLikeButton({ commentId }: { commentId: string }) {
  const [count, setCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    let ignore = false;
    fetch(`/api/comments/${commentId}/like`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (!ignore) {
          setCount(data.count ?? 0);
          setLiked(Boolean(data.liked));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [commentId]);

  const toggle = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      const res = await fetch(`/api/comments/${commentId}/like`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setLiked(Boolean(data.liked));
        setCount(data.count ?? 0);
      }
    } finally {
      setToggling(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading || toggling}
      className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] font-semibold transition disabled:opacity-60 ${
        liked
          ? "border-teal-200 bg-teal-50 text-teal-700"
          : "border-gray-200 text-gray-600 hover:bg-gray-50"
      }`}
    >
      <svg className="w-3 h-3" fill={liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
        />
      </svg>
      {count > 0 ? count : "Like"}
    </button>
  );
}
