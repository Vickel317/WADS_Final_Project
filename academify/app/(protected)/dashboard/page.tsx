"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats { connections: number; forumPosts: number; filesShared: number; eventsAttended: number }
interface Activity { id: string; user: string; action: string; detail: string; sub?: string; time: string }
interface Event { id: string; title: string; time: string; location: string; participants: number }
interface Thread { id: string; title: string; author: string; likes: number; replies: number; tag: string }

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ connections: 248, forumPosts: 67, filesShared: 142, eventsAttended: 23 });
  const [activity, setActivity] = useState<Activity[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);

  useEffect(() => {
    // Fetch real data from your API
    fetch("/api/users/me/stats").then(r => r.json()).then(d => d.stats && setStats(d.stats)).catch(() => {});
    fetch("/api/users/me/activity").then(r => r.json()).then(d => setActivity(d.activity || [])).catch(() => {});
    fetch("/api/events?upcoming=true&limit=2").then(r => r.json()).then(d => setEvents(d.events || [])).catch(() => {});
    fetch("/api/posts?trending=true&limit=3").then(r => r.json()).then(d => setThreads(d.threads || [])).catch(() => {});
  }, []);

  // Fallback display data while API loads
  const displayActivity: Activity[] = activity.length ? activity : [
    { id: "1", user: "Sarah Chen", action: "posted in", detail: "Advanced Algorithms", sub: "Has anyone solved the dynamic programming problem from lecture 5?", time: "3 hours ago" },
    { id: "2", user: "Mike Johnson", action: "shared a file in", detail: "Data Structures", sub: "Binary_Trees_Notes.pdf", time: "4 hours ago" },
  ];

  const displayEvents: Event[] = events.length ? events : [
    { id: "1", title: "Machine Learning Study Group", time: "Today, 4:00 PM", location: "Library Room 203", participants: 8 },
    { id: "2", title: "Web Development Workshop", time: "Tomorrow, 2:00 PM", location: "CS Building Lab 1", participants: 15 },
  ];

  const displayThreads: Thread[] = threads.length ? threads : [
    { id: "1", title: "Best resources for learning React?", author: "Alex Turner", likes: 94, replies: 24, tag: "Web Development" },
  ];

  const statCards = [
    { label: "Connections",     value: stats.connections,    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
    ), color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Forum Posts",     value: stats.forumPosts,     icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
    ), color: "text-teal-600", bg: "bg-teal-50" },
    { label: "Files Shared",    value: stats.filesShared,    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
    ), color: "text-orange-500", bg: "bg-orange-50" },
    { label: "Events Attended", value: stats.eventsAttended, icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
    ), color: "text-purple-500", bg: "bg-purple-50" },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome back, <span style={{ color: "#0d9488" }}>JOHN</span>!
        </h1>
        <p className="text-gray-400 text-sm mt-0.5">Here's what's happening in your community today</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-gray-800">{s.value}</p>
            </div>
            <div className={`w-12 h-12 rounded-xl ${s.bg} ${s.color} flex items-center justify-center`}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Activity */}
        <div className="col-span-1 lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-700 text-sm mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {displayActivity.map((a) => (
              <div key={a.id} className="flex flex-col sm:flex-row sm:gap-3 gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">{a.user}</span>
                    <span className="text-gray-400"> {a.action} </span>
                    <span className="font-medium text-gray-700">{a.detail}</span>
                  </p>
                  {a.sub && <p className="text-xs text-gray-400 mt-0.5">{a.sub}</p>}
                  <div className="flex items-center gap-1 mt-1.5">
                    <svg className="w-3 h-3 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                    </svg>
                    <span className="text-[11px] text-gray-400">{a.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="col-span-1 bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-700 text-sm mb-4">Upcoming Events</h2>
          <div className="space-y-3">
            {displayEvents.map((ev) => (
              <Link key={ev.id} href={`/events/${ev.id}`}
                className="block border border-gray-100 hover:border-teal-200 rounded-xl p-3.5 transition group">
                <p className="text-sm font-semibold text-gray-700 group-hover:text-teal-600 transition mb-2">{ev.title}</p>
                <div className="space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 text-[11px] text-gray-400 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      {ev.time}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 text-[11px] text-gray-400 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                      {ev.location}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    {ev.participants} participants
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Trending Discussions */}
        <div className="col-span-1 lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-700 text-sm mb-4">Trending Discussions</h2>
          <div className="space-y-3">
            {displayThreads.map((t) => (
              <Link key={t.id} href={`/thread/${t.id}`}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-xl hover:bg-gray-50 transition group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-700 group-hover:text-teal-600 transition">{t.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">by {t.author}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                      {t.likes}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                      {t.replies} replies
                    </span>
                  </div>
                </div>
                <span className="mt-3 sm:mt-0 sm:ml-4 px-3 py-1 text-xs font-medium text-teal-700 bg-teal-50 rounded-full shrink-0">{t.tag}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}