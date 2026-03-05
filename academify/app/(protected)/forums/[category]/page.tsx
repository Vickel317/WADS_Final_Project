"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

const categories = [
  { label: "All Topics", slug: "all", count: 234 },
  { label: "Computer Science", slug: "computer-science", count: 89 },
  { label: "Mathematics", slug: "mathematics", count: 56 },
  { label: "Web Development", slug: "web-development", count: 67 },
  { label: "AI & Machine Learning", slug: "ai-machine-learning", count: 45 },
  { label: "Study Groups", slug: "study-groups", count: 78 },
];

const mockThreads = [
  {
    id: 1,
    pinned: true,
    title: "Best practices for React state management?",
    author: "Sarah Chen",
    category: "Web Development",
    categorySlug: "web-development",
    time: "2 hours ago",
    likes: 56,
    replies: 24,
    views: 342,
  },
  {
    id: 2,
    pinned: false,
    title: "Help with Dynamic Programming algorithms",
    author: "Mike Johnson",
    category: "Computer Science",
    categorySlug: "computer-science",
    time: "4 hours ago",
    likes: 34,
    replies: 18,
    views: 289,
  },
  {
    id: 3,
    pinned: false,
    title: "Study partners for Machine Learning final",
    author: "Emma Wilson",
    category: "Study Groups",
    categorySlug: "study-groups",
    time: "6 hours ago",
    likes: 67,
    replies: 32,
    views: 456,
  },
  {
    id: 4,
    pinned: false,
    title: "Calculus 3: Integration techniques explained",
    author: "Alex Turner",
    category: "Mathematics",
    categorySlug: "mathematics",
    time: "1 day ago",
    likes: 89,
    replies: 41,
    views: 578,
  },
  {
    id: 5,
    pinned: false,
    title: "Intro to Neural Networks - resources & tips",
    author: "Linda Park",
    category: "AI & Machine Learning",
    categorySlug: "ai-machine-learning",
    time: "2 days ago",
    likes: 102,
    replies: 55,
    views: 812,
  },
];

type Tab = "Trending" | "Recent" | "Most Popular" | "Unanswered";

export default function CategoryForumsPage() {
  const { category } = useParams<{ category: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("Trending");
  const [search, setSearch] = useState("");
  const [bookmarked, setBookmarked] = useState<number[]>([]);

  const toggleBookmark = (id: number) => {
    setBookmarked((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  const filteredThreads = mockThreads.filter((thread) => {
    const matchesCategory = thread.categorySlug === category;
    const matchesSearch =
      search === "" ||
      thread.title.toLowerCase().includes(search.toLowerCase()) ||
      thread.author.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCategoryClick = (slug: string) => {
    if (slug === "all") {
      router.push("/forums");
    } else {
      router.push(`/forums/${slug}`);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discussion Forums</h1>
          <p className="text-sm text-gray-400 mt-0.5">Connect, discuss, and learn together</p>
        </div>
        <button
          onClick={() => router.push(`/forums/${category}/new`)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition"
          style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Thread
        </button>
      </div>

      <div className="flex gap-4 items-start">
        {/* Categories Sidebar */}
        <div className="w-56 shrink-0 bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3 px-1">Categories</p>
          <div className="space-y-1">
            {categories.map((cat) => {
              const active = cat.slug === category || (cat.slug === "all" && !category);
              return (
                <button
                  key={cat.slug}
                  onClick={() => handleCategoryClick(cat.slug)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition ${
                    active ? "text-white font-medium" : "text-gray-600 hover:bg-gray-50"
                  }`}
                  style={active ? { background: "linear-gradient(135deg, #0d9488, #0f766e)" } : {}}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                      active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Threads Panel */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100">
          {/* Search */}
          <div className="px-4 pt-4 pb-3 border-b border-gray-100">
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
                placeholder="Search discussions..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 transition"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-100">
            {(["Trending", "Recent", "Most Popular", "Unanswered"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
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
            {filteredThreads.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-sm">
                No threads found in this category.
              </div>
            ) : (
              filteredThreads.map((thread) => (
                <div key={thread.id} className="flex items-start gap-4 px-4 py-4 hover:bg-gray-50/50 transition cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {thread.pinned && (
                        <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-600">
                          Pinned
                        </span>
                      )}
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{thread.title}</h3>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                      <span>by {thread.author}</span>
                      <span>•</span>
                      <span className="px-2 py-0.5 rounded-md font-medium text-teal-700 bg-teal-50">
                        {thread.category}
                      </span>
                      <span>•</span>
                      <span>{thread.time}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
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
                        {thread.replies} replies
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