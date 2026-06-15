"use client";

import { useRef, useState } from "react";

type ForumModeratorSettingsProps = {
  open: boolean;
  onClose: () => void;
  forumId: string;
  forumName: string;
  description: string;
  imageUrl?: string | null;
  onDescriptionSaved: (description: string) => void;
  onImageUploaded?: () => void | Promise<void>;
};

export default function ForumModeratorSettings({
  open,
  onClose,
  forumId,
  forumName,
  description,
  imageUrl,
  onDescriptionSaved,
  onImageUploaded,
}: ForumModeratorSettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(description);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (!open) return null;

  const displayUrl = localPreview ?? imageUrl ?? "";

  const saveDescription = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/categories/${forumId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ description: draft.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to update description");
      }
      const nextDescription = data.category?.description ?? draft.trim();
      onDescriptionSaved(nextDescription);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update description");
    } finally {
      setSaving(false);
    }
  };

  const handleImagePick = async (file: File | undefined) => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/storage/upload-entity-banner/forum/${forumId}`, {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to upload image");
      }
      await onImageUploaded?.();
      URL.revokeObjectURL(objectUrl);
      setLocalPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
      URL.revokeObjectURL(objectUrl);
      setLocalPreview(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const descriptionDirty = draft.trim() !== description.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-gray-100 bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-gray-900">Edit forum</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="shrink-0">
            <p className="mb-2 text-xs font-semibold text-gray-700">Forum photo</p>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
                {displayUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={displayUrl} alt={forumName} className="h-full w-full object-cover" />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center text-2xl font-bold text-gray-400"
                    style={{ background: "linear-gradient(135deg, #f3f4f6, #e5e7eb)" }}
                  >
                    {forumName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-60"
                >
                  {uploading ? "Uploading..." : "Change photo"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImagePick(e.target.files?.[0])}
                />
                <p className="mt-1.5 text-xs text-gray-400">JPG, PNG or WebP. Max 5MB.</p>
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <label htmlFor="forum-name" className="text-xs font-semibold text-gray-700">
                Forum name
              </label>
              <input
                id="forum-name"
                type="text"
                value={forumName}
                disabled
                readOnly
                className="mt-1.5 w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-3 py-2.5 text-sm font-medium text-gray-400"
              />
              <p className="mt-1 text-xs text-gray-400">Name cannot be changed</p>
            </div>

            <div>
              <label htmlFor="forum-description" className="text-xs font-semibold text-gray-700">
                Description
              </label>
              <textarea
                id="forum-description"
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setError(null);
                  setSaved(false);
                }}
                rows={3}
                maxLength={500}
                className="mt-1.5 w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="Describe this forum"
              />
              {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={saveDescription}
                  disabled={saving || !descriptionDirty || draft.trim().length < 3}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)" }}
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
                {saved && <span className="text-xs font-medium text-teal-600">Saved</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
