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

  // Compute connections (where isConnected = true)
  // To avoid duplicates if they appear in both arrays, let's just filter `following` for mutuals.
  const mutuals = following.filter((u) => u.isConnected);

  let currentList: ConnectionUser[] = [];
  if (activeTab === "connections") currentList = mutuals;
  if (activeTab === "followers") currentList = followers;
  if (activeTab === "following") currentList = following;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 rounded-full border-4 border-teal-200 border-t-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 font-serif">Your Network</h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("connections")}
          className={`pb-3 px-6 text-sm font-medium transition-all border-b-2 ${
            activeTab === "connections" ? "border-teal-600 text-teal-700" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Connections ({mutuals.length})
        </button>
        <button
          onClick={() => setActiveTab("followers")}
          className={`pb-3 px-6 text-sm font-medium transition-all border-b-2 ${
            activeTab === "followers" ? "border-teal-600 text-teal-700" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Followers ({followers.length})
        </button>
        <button
          onClick={() => setActiveTab("following")}
          className={`pb-3 px-6 text-sm font-medium transition-all border-b-2 ${
            activeTab === "following" ? "border-teal-600 text-teal-700" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Following ({following.length})
        </button>
      </div>

      {/* User Grid */}
      {currentList.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center">
          <div className="w-16 h-16 bg-gray-50 text-3xl flex items-center justify-center rounded-full mx-auto mb-4">
            🤝
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No people found</h3>
          <p className="text-gray-500 text-sm">
            {activeTab === "connections" && "You haven't made any mutual connections yet."}
            {activeTab === "followers" && "You don't have any followers yet."}
            {activeTab === "following" && "You aren't following anyone yet."}
          </p>
          <p className="text-sm text-teal-600 mt-4 cursor-pointer hover:underline" onClick={() => document.querySelector('input')?.focus()}>
            Try searching for friends above ↑
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentList.map((user) => (
            <Link 
              key={user.userId} 
              href={`?profileId=${user.userId}`}
            >
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-teal-100 transition group h-full">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-lg">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-teal-700 transition">
                      {user.name}
                    </h3>
                    <p className="text-xs text-gray-400">@{user.username}</p>
                    {user.major && <p className="text-xs text-teal-600 mt-1">{user.major}</p>}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Suggested Users */}
      {suggested.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6 font-serif">Discover People</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggested.map((user) => (
              <Link 
                key={user.userId} 
                href={`?profileId=${user.userId}`}
              >
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-teal-100 transition group h-full">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-lg shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 group-hover:text-teal-700 transition truncate">
                        {user.name}
                      </h3>
                      {user.username && <p className="text-xs text-gray-400 truncate">@{user.username}</p>}
                      {user.major && <p className="text-xs text-teal-600 mt-1 truncate">{user.major}</p>}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}