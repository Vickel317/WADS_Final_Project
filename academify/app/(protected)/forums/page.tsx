"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/components/current-user-context";
import { AiRecommend } from "@/components/ai-recommend";
import { canCreateForum } from "@/lib/forum-access";

type ForumCategory = {
  id: string;
  name: string;
  description: string;
  imageUrl?: string | null;
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

  const canCreate = canCreateForum(currentUser?.role);

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Forums</h1>
          <p className="text-sm text-gray-500 mt-1">
            Pick a community to browse threads, events, and group workspaces.
          </p>
        </div>
      </div>

      {!canCreate && (
        <p className="mb-4 text-sm text-gray-500 rounded-xl border border-gray-100 bg-white px-4 py-3">
          Forums are created by lecturers and admins. Join an existing forum to post and collaborate.
        </p>
      )}

      {canCreate && currentUser?.role === "lecturer" && (
        <p className="mb-4 text-sm text-gray-500 rounded-xl border border-gray-100 bg-white px-4 py-3">
          As a lecturer, you can create course or topic forums for your students.
        </p>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        <div className="min-w-0 space-y-6">
          <AiRecommend variant="threads" paginated title="Threads you might like" />

          {loading ? (
            <p className="text-sm text-gray-400">Loading forums...</p>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : categories.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center">
              <p className="text-gray-600 font-medium">No forums yet</p>
              <p className="text-sm text-gray-400 mt-2">
                {canCreate
                  ? "Create the first forum to get started."
                  : "Check back later once a lecturer or admin has created a forum."}
              </p>
              {canCreate && (
                <Link
                  href="/forums/new"
                  className="mt-4 inline-block px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700"
                >
                  Create Forum
                </Link>
              )}
            </div>
          ) : (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">All forums</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {categories.map((forum) => (
                  <Link
                    key={forum.id}
                    href={`/forums/${forum.slug}`}
                    className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md"
                  >
                    {forum.imageUrl ? (
                      <div className="mb-4 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                        <img src={forum.imageUrl} alt={forum.name} className="h-40 w-full object-cover" />
                      </div>
                    ) : (
                      <div className="mb-4 flex h-40 items-center justify-center rounded-xl border border-gray-100 bg-linear-to-br from-teal-50 to-cyan-50 text-4xl font-bold text-teal-700">
                        {forum.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
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
            </section>
          )}
        </div>

        <aside className="xl:sticky xl:top-24 space-y-4">
          <AiRecommend variant="forums" title="You might like this forum!" deferMs={400} />
        </aside>
      </div>
    </div>
  );
}
