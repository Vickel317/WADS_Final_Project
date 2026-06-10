"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { disconnectSocket, getSocket } from "@/lib/socket-client";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/components/current-user-context";

type SearchUser = {
  userId: string;
  name: string;
  username: string;
  isConnected?: boolean;
};

type Notification = {
  notificationID: string;
  content: string;
  link: string | null;
  createdAt: string;
};

export default function Topbar() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userName, setUserName] = useState(currentUser?.name ?? "Signed in user");
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(currentUser?.avatarUrl ?? null);

  const searchUsers = useCallback(async (searchTerm: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users?q=${encodeURIComponent(searchTerm)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.users || []);
        setShowDropdown(true);
      }
    } catch (error) {
      console.error("Failed to search users", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim().length > 0) {
        void searchUsers(query);
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, searchUsers]);

  useEffect(() => {
    let active = true;
    fetch("/api/users/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data?.user) return;
        const avatar = typeof data.user.avatarUrl === "string" ? data.user.avatarUrl : null;
        const resolvedAvatar =
          avatar && (avatar.startsWith("http") || avatar.startsWith("data:") || avatar.startsWith("/api/"))
            ? avatar
            : avatar
            ? `/api/users/${data.user.userId}/avatar`
            : null;
        setUserName(data.user.name || "Signed in user");
        setUserAvatarUrl(resolvedAvatar);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [currentUser?.name, currentUser?.avatarUrl]);

  // Fetch initial notifications
  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => {
        if (!res.ok) {
          res.text().then(text => console.error("Error fetching notifications:", res.status, text));
          return Promise.reject(new Error(`HTTP error! status: ${res.status}`));
        }
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          return res.json();
        } else {
          return null;
        }
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setNotifications(data);
        }
      })
      .catch(error => console.error("Failed to fetch or parse notifications:", error));
  }, []);

  // Poll for upcoming event reminders every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetch("/api/events/reminders").catch(() => {});
    }, 5 * 60 * 1000);

    // Initial check
    fetch("/api/events/reminders").catch(() => {});

    return () => clearInterval(interval);
  }, []);

  // Listen for real-time notifications via socket.io
  useEffect(() => {
    const socket = getSocket();

    function onConnect() {
      if (currentUser?.userId) {
        socket.emit("authenticate", currentUser.userId);
      }
    }

    function onNewNotification(notification: Notification) {
      setNotifications((prev) => {
        if (prev.some((n) => n.notificationID === notification.notificationID)) return prev;
        return [notification, ...prev];
      });
    }

    socket.on("connect", onConnect);
    socket.on("new_notification", onNewNotification);

    if (!socket.connected) {
      socket.connect();
    } else if (currentUser?.userId) {
      socket.emit("authenticate", currentUser.userId);
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("new_notification", onNewNotification);
    };
  }, [currentUser?.userId]);

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, { method: "PATCH" });
      setNotifications((prev) => prev.filter((n) => n.notificationID !== notificationId));
    } catch {
      // ignore
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", { method: "POST" });
      setNotifications([]);
    } catch {
      // ignore
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-100 flex items-center justify-center pl-14 pr-3 sm:pl-16 sm:pr-4 md:pl-4 md:pr-6 gap-2 sm:gap-4 z-30 transition-all duration-300"
      style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      {/* Search */}
      <div className="w-full max-w-[320px] md:max-w-sm relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0 || loading) setShowDropdown(true);
          }}
          onBlur={() => {
            setTimeout(() => setShowDropdown(false), 200);
          }}
          placeholder="Search people..."
          className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 transition"
        />

        {/* Dropdown Results */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl shadow-teal-900/5 max-h-80 overflow-y-auto z-50">
            {loading && (
              <div className="p-4 text-center text-sm text-gray-500">Searching...</div>
            )}
            {!loading && results.length === 0 && (
              <div className="p-4 text-center text-sm text-gray-500">No users found.</div>
            )}
            {!loading && results.length > 0 && (
              <ul className="py-2">
                {results.map((user) => (
                  <li key={user.userId}>
                    <Link
                      href={`?profileId=${user.userId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition"
                    >
                      <div className="w-8 h-8 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-bold text-xs">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-800">{user.name}</span>
                        <span className="text-xs text-gray-500">@{user.username} {user.isConnected ? "• Connected" : ""}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="absolute right-3 sm:right-4 md:right-6 flex items-center gap-1.5 sm:gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen((v) => !v)}
            className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl hover:bg-gray-50 flex items-center justify-center transition"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
            </svg>
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-white text-xs flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50">
              <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
                {notifications.length > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <ul className="py-1 max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <li key={notification.notificationID}>
                      <button
                        onClick={() => {
                          markAsRead(notification.notificationID);
                          if (notification.link) {
                            router.push(notification.link);
                          }
                          setNotificationsOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <p className="font-medium">{notification.content}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-3 text-sm text-gray-500 text-center">
                    No new notifications
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
        <div className="relative">
          <button onClick={() => setProfileOpen((v) => !v)} className="flex items-center gap-2 rounded-xl px-1.5 sm:px-2 py-1.5 hover:bg-gray-50 transition">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center shrink-0">
              {userAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={userAvatarUrl} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-semibold text-gray-500">{userName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <span className="hidden md:inline text-sm text-gray-700 font-medium max-w-28 truncate">{userName}</span>
          </button>
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-50 p-1">
              <Link onClick={() => setProfileOpen(false)} href="/profile/edit" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                Profile
              </Link>
              <Link onClick={() => setProfileOpen(false)} href="/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                Settings
              </Link>
              <div className="h-px bg-gray-100 my-1 mx-2" />
              <button
                onClick={async () => {
                  setProfileOpen(false);
                  disconnectSocket();
                  await authClient.signOut({
                    fetchOptions: {
                      onSuccess: () => router.push("/login"),
                    },
                  });
                }}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
