"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function isValidForumName(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length < 2) return "Name must be at least 2 characters.";
  if (trimmed.length > 100) return "Name must be 100 characters or fewer.";
  if (!/^[a-zA-Z0-9\s&'-]+$/.test(trimmed)) return "Name can only contain letters, numbers, spaces, hyphens, apostrophes, and ampersands.";
  return null;
}

export default function NewForumPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const nameError = isValidForumName(name);
    if (nameError) {
      setError(nameError);
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      if (imageFile) formData.append("imageFile", imageFile);

      const res = await fetch("/api/categories", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create forum");
      }

      router.push(`/forums/${data.category.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create a new forum</h1>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Forum Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Computer Science"
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 transition"
            required
          />
          <p className="mt-1 text-xs text-gray-400">Letters, numbers, spaces, hyphens, apostrophes, and ampersands only.</p>
        </div>
        <div className="mb-6">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 transition"
          />
        </div>
        <div className="mb-6">
          <label htmlFor="imageFile" className="block text-sm font-medium text-gray-700 mb-1">
            Forum image
          </label>
          <input
            id="imageFile"
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-teal-700 hover:file:bg-teal-100"
          />
          <p className="mt-2 text-xs text-gray-400">Optional. Upload an image to show on the forum card and page.</p>
        </div>
        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:bg-gray-400"
        >
          {loading ? "Creating..." : "Create Forum"}
        </button>
      </form>
    </div>
  );
}
