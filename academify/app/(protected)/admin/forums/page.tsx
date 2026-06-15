"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminBackLink } from "@/components/admin-back-link";

type ForumItem = {
  id: string;
  name: string;
  description: string;
  slug: string;
  createdAt: string;
};

type ForumForm = {
  name: string;
  description: string;
};

const emptyForm: ForumForm = { name: "", description: "" };

function isValidForumName(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length < 2) return "Name must be at least 2 characters.";
  if (trimmed.length > 100) return "Name must be 100 characters or fewer.";
  if (!/^[a-zA-Z0-9\s&'-]+$/.test(trimmed)) return "Name can only contain letters, numbers, spaces, hyphens, apostrophes, and ampersands.";
  return null;
}

export default function AdminForumsPage() {
  const [forums, setForums] = useState<ForumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<ForumForm>(emptyForm);
  const [editing, setEditing] = useState<Record<string, ForumForm>>({});

  const canCreate = useMemo(
    () => createForm.name.trim().length > 1 && createForm.description.trim().length > 2,
    [createForm]
  );

  const loadForums = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error?.message || "Failed to load forums");
      setForums(data.categories || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load forums");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadForums();
  }, []);

  const createForum = async () => {
    if (!canCreate) return;
    const nameError = isValidForumName(createForm.name);
    if (nameError) {
      setError(nameError);
      return;
    }
    setCreating(true);
    try {
      const name = createForm.name.trim();
      const description = createForm.description.trim();
      const slug = name.toLowerCase().replace(/\s+/g, "-");
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, description, slug }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error?.message || "Failed to create forum");
      setCreateForm(emptyForm);
      await loadForums();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create forum");
    } finally {
      setCreating(false);
    }
  };

  const saveForum = async (forumId: string) => {
    const form = editing[forumId];
    if (!form || !form.name.trim()) return;
    const nameError = isValidForumName(form.name);
    if (nameError) {
      setError(nameError);
      return;
    }
    setUpdatingId(forumId);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
      };
      const res = await fetch(`/api/categories/${forumId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error?.message || "Failed to update forum");
      await loadForums();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update forum");
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteForum = async (forumId: string) => {
    if (!confirm("Delete this forum? Threads/events/collab tied to it may be affected.")) return;
    setDeletingId(forumId);
    try {
      const res = await fetch(`/api/categories/${forumId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error?.message || "Failed to delete forum");
      setForums((prev) => prev.filter((f) => f.id !== forumId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete forum");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <AdminBackLink />
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-gray-900">Admin Forums</h1>
        <p className="mt-2 text-sm text-gray-600">Create, edit, and delete forum hubs.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">Create Forum</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={createForm.name}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Forum name (e.g. Computer Science)"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <input
            value={createForm.description}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Forum description"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <p className="text-xs text-gray-400">Name: letters, numbers, spaces, hyphens, apostrophes, and ampersands only (2-100 chars).</p>
        <button
          disabled={!canCreate || creating}
          onClick={createForum}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {creating ? "Creating..." : "Create forum"}
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        {loading ? (
          <p className="text-sm text-gray-500">Loading forums...</p>
        ) : forums.length === 0 ? (
          <p className="text-sm text-gray-500">No forums yet.</p>
        ) : (
          <div className="space-y-3">
            {forums.map((forum) => {
              const form = editing[forum.id] ?? {
                name: forum.name,
                description: forum.description || "",
              };
              return (
                <div key={forum.id} className="rounded-lg border border-gray-100 p-4 space-y-2">
                  <div className="grid gap-2 md:grid-cols-2">
                    <input
                      value={form.name}
                      onChange={(e) =>
                        setEditing((prev) => ({ ...prev, [forum.id]: { ...form, name: e.target.value } }))
                      }
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                    <input
                      value={form.description}
                      onChange={(e) =>
                        setEditing((prev) => ({ ...prev, [forum.id]: { ...form, description: e.target.value } }))
                      }
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-500">ID: {forum.id} · Slug: {forum.slug}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveForum(forum.id)}
                      disabled={updatingId === forum.id}
                      className="rounded-lg border border-teal-200 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-50 disabled:opacity-60"
                    >
                      {updatingId === forum.id ? "Saving..." : "Update"}
                    </button>
                    <button
                      onClick={() => deleteForum(forum.id)}
                      disabled={deletingId === forum.id}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      {deletingId === forum.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
