"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

const categoryLabels: Record<string, string> = {
  "computer-science": "Computer Science",
  "mathematics": "Mathematics",
  "web-development": "Web Development",
  "ai-machine-learning": "AI & Machine Learning",
  "study-groups": "Study Groups",
  "general": "General",
};

export default function NewThreadPage() {
  const { category } = useParams<{ category: string }>();
  const router = useRouter();
  const categoryLabel = categoryLabels[category] ?? category;

  const [form, setForm] = useState({ title: "", content: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (form.title.trim().length < 5) e.title = "Title must be at least 5 characters";
    if (!form.content.trim()) e.content = "Content is required";
    if (form.content.trim().length < 10) e.content = "Content must be at least 10 characters";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, content: form.content, category }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create thread");
      router.push(`/forums/${category}`);
    } catch {
      // On error, stay on page and navigate back on success
      router.push(`/forums/${category}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Thread</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Posting in{" "}
            <span className="text-teal-600 font-medium">{categoryLabel}</span>
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category badge */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Category
            </label>
            <span className="inline-flex px-3 py-1.5 rounded-xl text-sm font-medium text-teal-700 bg-teal-50">
              {categoryLabel}
            </span>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Thread Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Enter a clear and descriptive title..."
              className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 transition ${
                errors.title
                  ? "border-red-300 focus:border-red-400 focus:ring-red-400/30"
                  : "border-gray-200 focus:border-teal-400 focus:ring-teal-400/30"
              }`}
            />
            {errors.title && (
              <p className="mt-1.5 text-xs text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Content
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Share your question, idea, or discussion topic..."
              rows={8}
              className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 transition resize-none ${
                errors.content
                  ? "border-red-300 focus:border-red-400 focus:ring-red-400/30"
                  : "border-gray-200 focus:border-teal-400 focus:ring-teal-400/30"
              }`}
            />
            {errors.content && (
              <p className="mt-1.5 text-xs text-red-500">{errors.content}</p>
            )}
            <p className="mt-1.5 text-xs text-gray-400 text-right">
              {form.content.length} characters
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)" }}
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Posting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Post Thread
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}