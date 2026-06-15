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

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post? This cannot be undone.")) return;
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
  };

  return (
    <div className="w-full sm:w-auto">
      {!editing ? (
        <div className="flex items-center gap-2">
          {canEdit ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="whitespace-nowrap rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Edit
            </button>
          ) : showEditLockedNotice ? (
            <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
              Editing locked after moderation
            </span>
          ) : null}
          {canDelete && !canEdit && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="whitespace-nowrap rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>
      ) : (
        <div className="w-full max-w-xl space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
          <input
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            placeholder="Post title"
          />
          <textarea
            value={formContent}
            onChange={(e) => setFormContent(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            placeholder="Post content"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
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
              className="whitespace-nowrap rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setFormTitle(title);
                setFormContent(content);
                setError(null);
              }}
              className="whitespace-nowrap rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            {canDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="whitespace-nowrap rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            )}
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
