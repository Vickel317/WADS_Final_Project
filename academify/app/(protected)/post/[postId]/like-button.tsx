"use client";

import { useEffect, useState } from "react";

type LikeButtonProps = {
  postId: string;
  initialCount?: number;
};

export default function LikeButton({ postId, initialCount = 0 }: LikeButtonProps) {
  const storageKey = `forum-like:${postId}`;
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored === "1") {
      setLiked(true);
      setCount((prev) => Math.max(prev, initialCount + 1));
    }
  }, [storageKey, initialCount]);

  const toggleLike = () => {
    setLiked((prev) => {
      const next = !prev;
      localStorage.setItem(storageKey, next ? "1" : "0");
      setCount((current) => (next ? current + 1 : Math.max(0, current - 1)));
      return next;
    });
  };

  return (
    <button
      type="button"
      onClick={toggleLike}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
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
      {count} like{count === 1 ? "" : "s"}
    </button>
  );
}
