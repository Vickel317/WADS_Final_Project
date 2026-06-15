"use client";
import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { disconnectSocket } from "@/lib/socket-client";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { useCurrentUser } from "@/components/current-user-context";
import { useSidebarLayout } from "@/components/sidebar-layout-context";

type SearchUser = {
  userId: string;
  name: string;
  username: string;
  isConnected?: boolean;
};

const subscribeNoop = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const searchInputClassName =
  "w-full min-w-0 pl-9 pr-3 sm:pr-4 py-1.5 sm:py-2 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-600 placeholder-gray-400 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 transition";

export default function Topbar() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const { toggleMobileOpen } = useSidebarLayout();
  const searchMounted = useSyncExternalStore(subscribeNoop, getClientSnapshot, getServerSnapshot);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
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

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-gray-200 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-5"
      style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}
    >
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={toggleMobileOpen}
          className="md:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </button>

        <BrandLogo showName className="shrink-0 hidden md:flex" />
        <BrandLogo showName={false} size="sm" className="shrink-0 flex md:hidden" />
      </div>

      <div className="flex-1 min-w-0 flex justify-center px-1 sm:px-2">
        <div className="relative w-full max-w-xl">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchMounted ? (
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
              autoComplete="off"
              className={searchInputClassName}
            />
          ) : (
            <div className={`${searchInputClassName} text-transparent select-none`} aria-hidden>
              Search people...
            </div>
          )}

          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl shadow-teal-900/5 max-h-80 overflow-y-auto z-50">
              {loading && <div className="p-4 text-center text-sm text-gray-500">Searching...</div>}
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
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium text-gray-800 truncate">{user.name}</span>
                          <span className="text-xs text-gray-500 truncate">
                            @{user.username} {user.isConnected ? "• Connected" : ""}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        <div className="relative">
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full px-1.5 py-1 hover:bg-gray-100 transition"
          >
            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center shrink-0">
              {userAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={userAvatarUrl} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-semibold text-gray-500">{userName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <span className="hidden lg:inline text-sm text-gray-700 font-medium max-w-28 truncate">{userName}</span>
          </button>
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-50 p-1">
              <Link
                onClick={() => setProfileOpen(false)}
                href="/profile/edit"
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                Profile
              </Link>
              <Link
                onClick={() => setProfileOpen(false)}
                href="/settings"
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
              >
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
