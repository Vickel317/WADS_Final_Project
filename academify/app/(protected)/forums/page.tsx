"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ForumCategory = {
  id: string;
  name: string;
  description: string;
  slug: string;
  createdAt: string;
};

type ForumThread = {
  id: string;
  title: string;
  content: string;
  forumId: string;
  forumName: string;
  forumSlug: string;
  author: string;
  replyCount: number;
  replies: number;
  views: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
  status: string;
};

type Tab = "Trending" | "Recent" | "Most Popular" | "Unanswered";

export default function ForumsPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeTab, setActiveTab] = useState<Tab>("Trending");
  const [search, setSearch] = useState("");
  const [bookmarked, setBookmarked] = useState<string[]>([]);

  const toggleBookmark = (id: string) => {
    setBookmarked((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    let ignore = false;
    const loadCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load categories");
        if (!ignore) setCategories(data.categories ?? []);
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load categories");
        }
      }
    };
    loadCategories();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    const loadThreads = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (activeCategory !== "all") params.set("forum", activeCategory);
        if (activeTab === "Trending" || activeTab === "Most Popular") {
          params.set("trending", "true");
        }
        params.set("limit", "50");

        const res = await fetch(`/api/posts?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load threads");
        if (!ignore) setThreads(data.threads ?? []);
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load threads");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    loadThreads();
    return () => {
      ignore = true;
    };
  }, [activeCategory, activeTab]);

  const filteredThreads = useMemo(() => {
    return threads.filter((thread) => {
      const matchesSearch =
        search === "" ||
        thread.title.toLowerCase().includes(search.toLowerCase()) ||
        thread.author.toLowerCase().includes(search.toLowerCase());

      if (activeTab === "Unanswered") {
        return matchesSearch && thread.replyCount === 0;
      }

      return matchesSearch;
    });
  }, [threads, search, activeTab]);

  const threadCounts = useMemo(() => {
    return threads.reduce<Record<string, number>>((acc, thread) => {
      acc[thread.forumSlug] = (acc[thread.forumSlug] ?? 0) + 1;
      return acc;
    }, {});
  }, [threads]);

  const handleCategoryClick = (slug: string) => {
    setActiveCategory(slug);
    if (slug !== "all") {
      router.push(`/forums/${slug}`);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discussion Forums</h1>
          <p className="text-sm text-gray-400 mt-0.5">Connect, discuss, and learn together</p>
        </div>
        <button
          onClick={() => {
            const nextSlug =
              activeCategory === "all"
                ? categories[0]?.slug ?? "general"
                : activeCategory;
            router.push(`/forums/${nextSlug}/new`);
          }}
          className="flex items-center justify-center sm:justify-start gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition w-full sm:w-auto"
          style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Thread
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Categories Sidebar */}
        <div className="w-full lg:w-56 lg:shrink-0 bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3 px-1">Categories</p>
          <div className="space-y-1">
            {[{ id: "all", name: "All Topics", slug: "all", description: "", createdAt: "" }, ...categories].map((cat) => {
              const active = activeCategory === cat.slug;
              return (
                <button
                  key={cat.slug}
                  onClick={() => handleCategoryClick(cat.slug)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm transition ${
                    active ? "text-white font-medium" : "text-gray-600 hover:bg-gray-50"
                  }`}
                  style={active ? { background: "linear-gradient(135deg, #0d9488, #0f766e)" } : {}}
                >
                  <span>{cat.name}</span>
                  <span
                    className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                      active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {cat.slug === "all" ? threads.length : threadCounts[cat.slug] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Threads Panel */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 min-h-0">
          {/* Search */}
          <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-2 sm:pb-3 border-b border-gray-100">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-600 placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 transition"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 px-3 sm:px-4 py-2 border-b border-gray-100 overflow-x-auto">
            {(["Trending", "Recent", "Most Popular", "Unanswered"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-teal-50 text-teal-700"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Thread List */}
          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="py-12 sm:py-16 text-center text-gray-400 text-xs sm:text-sm px-3 sm:px-4">Loading threads...</div>
            ) : error ? (
              <div className="py-12 sm:py-16 text-center text-red-400 text-xs sm:text-sm px-3 sm:px-4">{error}</div>
            ) : filteredThreads.length === 0 ? (
              <div className="py-12 sm:py-16 text-center text-gray-400 text-xs sm:text-sm px-3 sm:px-4">No threads found.</div>
            ) : (
              filteredThreads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => router.push(`/post/${thread.id}`)}
                  className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 px-3 sm:px-4 py-4 hover:bg-gray-50/50 transition cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0 hidden sm:inline-flex sm:items-center sm:justify-center">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{thread.title}</h3>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5 text-xs text-gray-400 mb-2">
                      <span className="hidden sm:inline">by {thread.author}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="px-2 py-0.5 rounded-md font-medium text-teal-700 bg-teal-50 w-fit">
                        {thread.forumName}
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span>{new Date(thread.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-4 text-xs text-gray-400">
                      <button className="flex items-center gap-1 hover:text-teal-600 transition">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                        {thread.likes} likes
                      </button>
                      <button className="flex items-center gap-1 hover:text-teal-600 transition">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {thread.replyCount} replies
                      </button>
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {thread.views} views
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleBookmark(thread.id); }}
                    className="shrink-0 mt-1 transition"
                    style={{ color: bookmarked.includes(thread.id) ? "#0d9488" : "#d1d5db" }}
                  >
                    <svg
                      className="w-4 h-4"
                      fill={bookmarked.includes(thread.id) ? "currentColor" : "none"}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}