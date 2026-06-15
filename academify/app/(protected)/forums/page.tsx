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
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      {/* Banner */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 text-white"
        style={{ backgroundImage: "linear-gradient(135deg, #0f766e, #14b8a6, #06b6d4)" }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/20" />
          <div className="absolute -left-4 -bottom-4 w-28 h-28 rounded-full bg-white/15" />
        </div>
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Forums</h1>
            <p className="text-sm text-white/70 mt-1">
              Pick a community to browse threads, events, and group workspaces.
            </p>
          </div>
          {canCreate && (
            <Link
              href="/forums/new"
              className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/15 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/25"
            >
              New forum
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Link>
          )}
        </div>
      </div>

      {!canCreate && (
        <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800">
          Forums are created by lecturers and admins. Join an existing forum to post and collaborate.
        </div>
      )}

      {canCreate && currentUser?.role === "lecturer" && (
        <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800">
          As a lecturer, you can create course or topic forums for your students.
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        <div className="min-w-0 space-y-6">
          <AiRecommend variant="threads" paginated title="Threads you might like" />

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-5 h-5 rounded-full border-2 border-teal-200 border-t-teal-600 animate-spin" />
              Loading forums...
            </div>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : categories.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "linear-gradient(135deg, #ccfbf1, #99f6e4)" }}
              >
                <svg className="w-8 h-8 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-gray-800 font-semibold">No forums yet</p>
              <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                {canCreate
                  ? "Create the first forum to get started."
                  : "Check back later once a lecturer or admin has created a forum."}
              </p>
              {canCreate && (
                <Link
                  href="/forums/new"
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-xl hover:opacity-90 transition"
                  style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)" }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Forum
                </Link>
              )}
            </div>
          ) : (
            <section>
              <div className="flex items-center gap-2.5 mb-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg, #ccfbf1, #99f6e4)" }}
                >
                  <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-800">All forums</h2>
                  <p className="text-xs text-gray-500">{categories.length} communities</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {categories.map((forum) => (
                  <Link
                    key={forum.id}
                    href={`/forums/${forum.slug}`}
                    className="group rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:border-teal-200 hover:shadow-md overflow-hidden"
                  >
                    {forum.imageUrl ? (
                      <div className="h-36 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={forum.imageUrl} alt={forum.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />

                      </div>

                    ) : (
                      <div className="h-36 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #ccfbf1, #99f6e4)" }}>
                        <span className="text-4xl font-bold text-teal-700">{forum.name.slice(0, 1).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-teal-700 transition truncate">
                            {forum.name}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {forum.description || "Discussion, events, and collab spaces for this topic."}
                          </p>
                        </div>
                        <span
                          className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                          style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)" }}
                        >
                          {forum.name.slice(0, 1).toUpperCase()}
                        </span>
                      </div>
                      <p className="mt-3 text-xs font-medium text-teal-600">Open forum →</p>
                    </div>
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
