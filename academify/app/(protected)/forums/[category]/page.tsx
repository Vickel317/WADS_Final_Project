"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday } from "date-fns";
import { ForumHubNav, type ForumHubTab } from "@/components/forum-hub-nav";

type ForumCategory = {
  id: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  slug: string;
};

type ForumThread = {
  id: string;
  title: string;
  forumName: string;
  author: string;
  replyCount: number;
  views: number;
  likes: number;
  createdAt: string;
  status: string;
};

type ForumEvent = {
  id: string;
  title: string;
  date: string;
  location: string;
};

type CollabSpace = {
  spaceID: string;
  name: string;
  description: string | null;
  forumID: string;
};

type Tab = "Trending" | "Recent" | "Most Popular" | "Unanswered";

const THREAD_TABS: Tab[] = ["Trending", "Recent", "Most Popular", "Unanswered"];

function postFeedbackMessage(status: string | null) {
  switch (status) {
    case "approved":
      return {
        tone: "success" as const,
        text: "Your thread is live and visible to the community.",
      };
    case "blocked":
      return {
        tone: "error" as const,
        text: "Your thread was blocked by moderation.",
      };
    case "flagged":
      return {
        tone: "warning" as const,
        text: "Your thread is under review. You can see it, but others may not yet.",
      };
    case "pending":
    default:
      return {
        tone: "warning" as const,
        text: "Your thread was submitted and is being reviewed.",
      };
  }
}

function parseHubTab(value: string | null): ForumHubTab {
  if (value === "events" || value === "collab") return value;
  return "threads";
}

function ForumEventsTab({ events, category }: { events: ForumEvent[]; category: string }) {
  const [calMonth, setCalMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, ForumEvent[]>();
    for (const event of events) {
      const key = format(new Date(event.date), "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    return map;
  }, [events]);

  const monthStart = startOfMonth(calMonth);
  const monthEnd = endOfMonth(calMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  let day = calStart;
  while (day <= calEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const selectedEvents = selectedDate
    ? eventsByDate.get(format(selectedDate, "yyyy-MM-dd")) ?? []
    : [];

  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-400">
        No upcoming events in this forum.{" "}
        <Link href={`/events?forum=${category}&create=true`} className="text-teal-600 hover:underline font-medium">
          Create one
        </Link>
      </div>
    );
  }

  return (
    <div className="flex gap-5">
      {/* Left: selected day events */}
      <div className="flex-1 min-w-0">
        {selectedDate ? (
          <>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl font-bold text-gray-900">{format(selectedDate, "d")}</span>
              <span className="text-sm font-medium text-gray-500">{format(selectedDate, "EEE, MMM yyyy")}</span>
            </div>
            {selectedEvents.length === 0 ? (
              <p className="text-xs text-gray-400 py-4">No events on this day</p>
            ) : (
              <ul className="space-y-2">
                {selectedEvents.map((event) => (
                  <li key={event.id}>
                    <Link
                      href={`/events/${event.id}`}
                      className="group block rounded-xl border border-gray-100 p-3 transition hover:border-teal-200 hover:shadow-sm"
                    >
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-teal-700 transition truncate">
                        {event.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {new Date(event.date).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                        </span>
                        <span className="flex items-center gap-1 truncate">
                          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="truncate">{event.location}</span>
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="text-xs text-gray-400 py-4">Select a day to see events</p>
        )}
      </div>

      {/* Right: mini calendar */}
      <div className="w-48 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setCalMonth(subMonths(calMonth, 1))}
            className="p-1 rounded hover:bg-gray-100 transition text-gray-500"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <p className="text-xs font-semibold text-gray-700">{format(calMonth, "MMM yyyy")}</p>
          <button
            onClick={() => setCalMonth(addMonths(calMonth, 1))}
            className="p-1 rounded hover:bg-gray-100 transition text-gray-500"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-7 mb-0.5">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="text-center text-[9px] font-semibold text-gray-400 uppercase py-0.5">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-lg overflow-hidden">
          {days.map((d) => {
            const key = format(d, "yyyy-MM-dd");
            const hasEvents = eventsByDate.has(key);
            const inMonth = isSameMonth(d, calMonth);
            const today = isToday(d);
            const selected = selectedDate && isSameDay(d, selectedDate);

            return (
              <button
                key={key}
                onClick={() => setSelectedDate(d)}
                className={`
                  relative flex items-center justify-center py-1.5 text-[11px] transition
                  ${inMonth ? "bg-white hover:bg-teal-50" : "bg-gray-50 text-gray-300"}
                  ${selected ? "bg-teal-50 ring-1 ring-inset ring-teal-500 font-semibold text-teal-700" : ""}
                `}
              >
                <span
                  className={`
                    ${today && !selected ? "w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-bold" : ""}
                    ${!today ? (inMonth ? "text-gray-700" : "text-gray-300") : ""}
                  `}
                >
                  {format(d, "d")}
                </span>
                {hasEvents && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-teal-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function CategoryForumsPage() {
  const { category } = useParams<{ category: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const hubTab = parseHubTab(searchParams.get("tab"));
  const postedStatus = searchParams.get("posted");
  const postFeedback = postFeedbackMessage(postedStatus);

  const [forum, setForum] = useState<ForumCategory | null>(null);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [events, setEvents] = useState<ForumEvent[]>([]);
  const [spaces, setSpaces] = useState<CollabSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Trending");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let ignore = false;
    const loadForum = async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load forum");
        const match = (data.categories ?? []).find((c: ForumCategory) => c.slug === category);
        if (!ignore) setForum(match ?? null);
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : "Failed to load forum");
      }
    };
    loadForum();
    return () => {
      ignore = true;
    };
  }, [category]);

  useEffect(() => {
    if (!forum) return;
    let ignore = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (hubTab === "threads") {
          const params = new URLSearchParams();
          params.set("forum", category);
          if (activeTab === "Trending" || activeTab === "Most Popular") params.set("trending", "true");
          params.set("limit", "50");
          const res = await fetch(`/api/posts?${params.toString()}`);
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "Failed to load threads");
          if (!ignore) setThreads(data.threads ?? []);
        } else if (hubTab === "events") {
          const res = await fetch("/api/events?filter=upcoming");
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "Failed to load events");
          const filtered = (data.data ?? []).filter(
            (e: { forumId?: string }) => e.forumId === forum.id
          );
          if (!ignore) {
            setEvents(
              filtered.map((e: { id: string; title: string; date: string; location: string }) => ({
                id: e.id,
                title: e.title,
                date: e.date,
                location: e.location,
              }))
            );
          }
        } else {
          const res = await fetch("/api/collaboration");
          const data = await res.json();
          if (!res.ok) throw new Error(data.error?.message || "Failed to load spaces");
          const filtered = (data.spaces ?? []).filter(
            (s: CollabSpace) => s.forumID === forum.id
          );
          if (!ignore) setSpaces(filtered);
        }
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : "Failed to load content");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, [category, forum, hubTab, activeTab]);

  const filteredThreads = useMemo(() => {
    return threads.filter((thread) => {
      const matchesSearch =
        search === "" ||
        thread.title.toLowerCase().includes(search.toLowerCase()) ||
        thread.author.toLowerCase().includes(search.toLowerCase());
      if (activeTab === "Unanswered") return matchesSearch && thread.replyCount === 0;
      return matchesSearch;
    });
  }, [threads, search, activeTab]);

  if (!forum && !loading && !error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-gray-600 font-medium">Forum not found</p>
        <Link href="/forums" className="mt-4 inline-block text-sm text-teal-600 hover:underline">
          ← Back to all forums
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2">
        <Link href="/forums" className="text-xs text-gray-400 hover:text-teal-600 transition">
          ← All forums
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          {forum?.imageUrl ? (
            <div className="mb-4 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
              <img src={forum.imageUrl} alt={forum.name} className="h-56 w-full object-cover" />
            </div>
          ) : null}
          <h1 className="text-2xl font-bold text-gray-900">{forum?.name ?? category}</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-xl">
            {forum?.description || "Threads, calendar events, and team workspaces for this community."}
          </p>
        </div>
        {hubTab === "threads" && (
          <button
            onClick={() => router.push(`/forums/${category}/new`)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition shrink-0"
            style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)" }}
          >
            New thread
          </button>
        )}
        {hubTab === "events" && (
          <Link
            href={`/events?forum=${category}&create=true`}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition shrink-0"
            style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)" }}
          >
            New event
          </Link>
        )}
        {hubTab === "collab" && (
          <Link
            href={`/collaboration?forum=${category}`}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition shrink-0"
            style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)" }}
          >
            Create space
          </Link>
        )}
      </div>

      {category && <ForumHubNav forumSlug={category} activeTab={hubTab} />}

      {postedStatus && hubTab === "threads" && (
        <div
          className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
            postFeedback.tone === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : postFeedback.tone === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          {postFeedback.text}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400 py-8">Loading...</p>
      ) : error ? (
        <p className="text-sm text-red-500 py-8">{error}</p>
      ) : hubTab === "threads" ? (
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="px-4 pt-4 pb-3 border-b border-gray-100">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search threads in this forum..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 transition"
              />
            </div>
          </div>
          <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-100 overflow-x-auto">
            {THREAD_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-teal-50 text-teal-700"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="divide-y divide-gray-50">
            {filteredThreads.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-sm">No threads in this forum yet.</div>
            ) : (
              filteredThreads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => router.push(`/post/${thread.id}`)}
                  className={`flex items-start gap-4 px-4 py-4 hover:bg-gray-50/50 transition cursor-pointer ${
                    thread.status !== "approved" ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{thread.title}</h3>
                      {thread.status !== "approved" && (
                        <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
                          {thread.status}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      by {thread.author} · {new Date(thread.createdAt).toLocaleString()} · {thread.replyCount} replies
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : hubTab === "events" ? (
        <ForumEventsTab events={events} category={category} />
      ) : (
        <div className="space-y-3">
          {spaces.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-400">
              No collab spaces yet.{" "}
              <Link href={`/collaboration?forum=${category}`} className="text-teal-600 hover:underline">
                Create a study group
              </Link>
            </div>
          ) : (
            spaces.map((space) => (
              <Link
                key={space.spaceID}
                href={`/collaboration/${space.spaceID}`}
                className="block rounded-2xl border border-gray-100 bg-white p-4 hover:border-teal-200 transition"
              >
                <h3 className="font-semibold text-gray-900">{space.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{space.description ?? "Team workspace"}</p>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
