"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CommentActions({
  commentId,
  initialContent,
  canManage,
}: {
  commentId: string;
  initialContent: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [edited, setEdited] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canManage) return null;

  return (
    <div className="mt-2">
      {!editing ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing(true)}
            className="rounded border border-gray-200 px-2 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
          >
            Edit
          </button>
          <button
            onClick={async () => {
              if (!confirm("Delete this comment?")) return;
              setDeleting(true);
              setError(null);
              try {
                const res = await fetch(`/api/comments/${commentId}`, {
                  method: "DELETE",
                  credentials: "include",
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data?.error?.message || "Failed to delete comment");
                router.refresh();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to delete comment");
              } finally {
                setDeleting(false);
              }
            }}
            disabled={deleting}
            className="rounded border border-red-200 px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                if (!content.trim()) {
                  setError("Comment cannot be empty.");
                  return;
                }
                setSaving(true);
                setError(null);
                try {
                  const res = await fetch(`/api/comments/${commentId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ content: content.trim() }),
                  });
                  const data = await res.json().catch(() => ({}));
                  if (!res.ok) throw new Error(data?.error?.message || "Failed to update comment");
                  setEditing(false);
                  setEdited(true);
                  router.refresh();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Failed to update comment");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
              className="rounded bg-teal-600 px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setContent(initialContent);
                setError(null);
              }}
              className="rounded border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {edited && !editing && !error && (
        <p className="mt-1 text-[11px] font-semibold text-gray-500">edited</p>
      )}
    </div>
  );
}
