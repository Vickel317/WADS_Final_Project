"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type CommentFormProps = {
  postId: string;
  parentId?: string | null;
  replyTo?: string | null;
  onCancel?: () => void;
};

export default function CommentForm({ postId, parentId, replyTo, onCancel }: CommentFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submitComment = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError("Comment cannot be empty.");
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, string> = { content };
      if (parentId) body.parentId = parentId;

      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to post comment");
      }
      setContent("");
      router.refresh();
      onCancel?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setLoading(false);
    }
  };

  const isReply = !!parentId;

  return (
    <form onSubmit={submitComment} className="space-y-3">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {isReply ? `Reply to ${replyTo ?? "comment"}` : "Add Comment"}
      </label>
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={isReply ? 3 : 4}
        placeholder={isReply ? "Write a reply..." : "Share your thoughts..."}
        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400/30"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700 disabled:opacity-60"
        >
          {loading ? "Posting..." : isReply ? "Reply" : "Post Comment"}
        </button>
        {isReply && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
