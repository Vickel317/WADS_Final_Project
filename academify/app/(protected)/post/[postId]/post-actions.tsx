"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PostActions({
  postId,
  title,
  content,
  canDelete,
  canEdit,
  showEditLockedNotice = false,
}: {
  postId: string;
  title: string;
  content: string;
  canDelete: boolean;
  canEdit: boolean;
  showEditLockedNotice?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formTitle, setFormTitle] = useState(title);
  const [formContent, setFormContent] = useState(content);
  const [error, setError] = useState<string | null>(null);

  if (!canDelete && !canEdit) return null;

  return (
    <div className="w-full sm:w-auto">
      {!editing ? (
        <div className="flex items-center gap-2">
          {canEdit ? (
            <button
              onClick={() => setEditing(true)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Edit post
            </button>
          ) : showEditLockedNotice ? (
            <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
              Editing locked after moderation
            </span>
          ) : null}
          {canDelete && (
            <button
              onClick={async () => {
                if (!confirm("Delete this post? This cannot be undone.")) return;
                setDeleting(true);
                setError(null);
                try {
                  const res = await fetch(`/api/posts/${postId}`, {
                    method: "DELETE",
                    credentials: "include",
                  });
                  const data = await res.json().catch(() => ({}));
                  if (!res.ok) throw new Error(data?.error?.message || "Failed to delete post");
                  router.push("/forums");
                  router.refresh();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Failed to delete post");
                } finally {
                  setDeleting(false);
                }
              }}
              disabled={deleting}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              {deleting ? "Deleting..." : "Delete post"}
            </button>
          )}
        </div>
      ) : (
        <div className="w-full max-w-xl rounded-xl border border-gray-200 p-3 bg-gray-50 space-y-2">
          <input
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
            placeholder="Post title"
          />
          <textarea
            value={formContent}
            onChange={(e) => setFormContent(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
            placeholder="Post content"
          />
          <div className="flex gap-2">
            <button
              onClick={async () => {
                setSaving(true);
                setError(null);
                try {
                  const res = await fetch(`/api/posts/${postId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                      title: formTitle.trim(),
                      content: formContent.trim(),
                    }),
                  });
                  const data = await res.json().catch(() => ({}));
                  if (!res.ok) throw new Error(data?.error?.message || "Failed to update post");
                  setEditing(false);
                  router.refresh();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Failed to update post");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
              className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setFormTitle(title);
                setFormContent(content);
                setError(null);
              }}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
