"use client";

import { useEffect, useState } from "react";
import Link from "next/link";


interface ConnectionUser {
  userId: string;
  name: string;
  username: string;
  major: string | null;
  isFollowing: boolean;
  isFollower: boolean;
  isConnected: boolean;
}

export default function ConnectionsPage() {
  const [activeTab, setActiveTab] = useState<"connections" | "followers" | "following">("connections");
  const [following, setFollowing] = useState<ConnectionUser[]>([]);
  const [followers, setFollowers] = useState<ConnectionUser[]>([]);
  const [suggested, setSuggested] = useState<ConnectionUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/users/connections").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json())
    ])
      .then(([connData, suggestData]) => {
        setFollowing(connData.following || []);
        setFollowers(connData.followers || []);
        setSuggested(suggestData.users || []);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const mutuals = following.filter((u) => u.isConnected);

  let currentList: ConnectionUser[] = [];
  if (activeTab === "connections") currentList = mutuals;
  if (activeTab === "followers") currentList = followers;
  if (activeTab === "following") currentList = following;

  const tabs = [
    { key: "connections" as const, label: "Connections", count: mutuals.length },
    { key: "followers" as const, label: "Followers", count: followers.length },
    { key: "following" as const, label: "Following", count: following.length },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 rounded-full border-4 border-teal-200 border-t-teal-600 animate-spin" />
      </div>
    );
  }

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
        <div className="relative z-10">
          <h1 className="text-2xl font-bold">Your Network</h1>
          <p className="text-sm text-white/70 mt-1">Connect with classmates, colleagues, and communities.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-2xl border p-4 shadow-sm transition text-left ${
              activeTab === tab.key
                ? "border-teal-200 bg-teal-50 shadow-md"
                : "border-gray-100 bg-white hover:border-teal-200 hover:shadow-md"
            }`}
          >
            <p className="text-2xl font-bold text-gray-900">{tab.count}</p>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-0.5">{tab.label}</p>
          </button>
        ))}
      </div>

      {/* User Grid */}
      {currentList.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, #ccfbf1, #99f6e4)" }}
          >
            <svg className="w-8 h-8 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            {activeTab === "connections" && "No connections yet"}
            {activeTab === "followers" && "No followers yet"}
            {activeTab === "following" && "Not following anyone yet"}
          </h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            {activeTab === "connections" && "When you and another user follow each other, you'll see them here."}
            {activeTab === "followers" && "People who follow you will appear here."}
            {activeTab === "following" && "Start following people to see them here."}
          </p>
          <button
            onClick={() => document.querySelector<HTMLInputElement>('[placeholder="Search people..."]')?.focus()}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search for people
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {currentList.map((user) => (
            <Link key={user.userId} href={`?profileId=${user.userId}`}>
              <div className="group rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-teal-200 hover:shadow-md h-full">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-teal-700 transition truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">@{user.username}</p>
                    {user.major && <p className="text-xs text-teal-600 mt-0.5 truncate">{user.major}</p>}
                  </div>
                  {user.isConnected && (
                    <span className="shrink-0 w-2 h-2 rounded-full bg-teal-500" title="Connected" />
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Suggested Users */}
      {suggested.length > 0 && (
        <section>
          <div className="flex items-center gap-2.5 mb-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #ccfbf1, #99f6e4)" }}
            >
              <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Discover People</h2>
              <p className="text-xs text-gray-500">Suggested connections</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {suggested.map((user) => (
              <Link key={user.userId} href={`?profileId=${user.userId}`}>
                <div className="group rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-teal-200 hover:shadow-md h-full">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-teal-700 transition truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">@{user.username}</p>
                      {user.major && <p className="text-xs text-teal-600 mt-0.5 truncate">{user.major}</p>}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
