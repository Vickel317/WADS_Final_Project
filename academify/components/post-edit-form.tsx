"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PostEditFormProps = {
  postId: string;
  title: string;
  content: string;
};

export default function PostEditForm({ postId, title, content }: PostEditFormProps) {
  const router = useRouter();
  const [formTitle, setFormTitle] = useState(title);
  const [formContent, setFormContent] = useState(content);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!formTitle.trim()) next.title = "Title is required";
    if (formTitle.trim().length < 5) next.title = "Title must be at least 5 characters";
    if (!formContent.trim()) next.content = "Content is required";
    if (formContent.trim().length < 10) next.content = "Content must be at least 10 characters";
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
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
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to update post");
      }
      router.push(`/post/${postId}`);
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to update post");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 transition ${
      errors[field]
        ? "border-red-300 focus:border-red-400 focus:ring-red-400/30"
        : "border-gray-200 focus:border-teal-400 focus:ring-teal-400/30"
    }`;

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push(`/post/${postId}`)}
          className="flex h-8 w-8 items-center justify-center rounded-xl transition hover:bg-gray-100"
        >
          <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Post</h1>
          <p className="mt-0.5 text-sm text-gray-400">Update your thread title and content.</p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-gray-100 bg-white p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Title
            </label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Post title"
              className={inputClass("title")}
            />
            {errors.title && <p className="mt-1.5 text-xs text-red-500">{errors.title}</p>}
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Content
            </label>
            <textarea
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              rows={10}
              placeholder="Post content"
              className={`${inputClass("content")} resize-none`}
            />
            {errors.content && <p className="mt-1.5 text-xs text-red-500">{errors.content}</p>}
          </div>

          {submitError && <p className="text-sm text-red-500">{submitError}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push(`/post/${postId}`)}
              disabled={loading}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-teal-600 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
