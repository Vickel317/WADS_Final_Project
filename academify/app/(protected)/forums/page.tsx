"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/components/current-user-context";

type ForumCategory = {
  id: string;
  name: string;
  description: string;
  slug: string;
  createdAt: string;
};

export default function ForumsPage() {
  const currentUser = useCurrentUser();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load forums");
        if (!ignore) setCategories(data.categories ?? []);
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load forums");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const isStaff = currentUser?.role === "admin" || currentUser?.role === "lecturer";

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Forums</h1>
          <p className="text-sm text-gray-500 mt-1">
            Pick a community to browse threads, events, and group workspaces.
          </p>
        </div>
      </div>

      {isStaff && currentUser?.role !== "admin" && (
        <p className="mb-4 text-sm text-gray-500 rounded-xl border border-gray-100 bg-white px-4 py-3">
          Lecturers and admins can create forums via the admin tools. Students join existing forums to post and collaborate.
        </p>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Loading forums...</p>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : categories.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center">
          <p className="text-gray-600 font-medium">No forums yet</p>
          <p className="text-sm text-gray-400 mt-2">An admin can create the first forum from the Admin panel.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {categories.map((forum) => (
            <Link
              key={forum.id}
              href={`/forums/${forum.slug}`}
              className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900 group-hover:text-teal-700 transition">
                    {forum.name}
                  </h2>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                    {forum.description || "Discussion, events, and collab spaces for this topic."}
                  </p>
                </div>
                <span
                  className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)" }}
                >
                  {forum.name.slice(0, 1).toUpperCase()}
                </span>
              </div>
              <p className="mt-4 text-xs font-medium text-teal-600">Open forum →</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
