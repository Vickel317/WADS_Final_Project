"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useCurrentUser } from "@/components/current-user-context";
import { useSidebarLayout } from "@/components/sidebar-layout-context";
import { canCreateForum } from "@/lib/forum-access";

const primaryNav = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    href: "/forums",
    label: "Forums",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
        />
      </svg>
    ),
  },
];

const secondaryNav = [
  {
    href: "/messages",
    label: "Chat",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    ),
  },
  {
    href: "/connections",
    label: "Connections",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
  },
  {
    href: "/files",
    label: "My uploads",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
        />
      </svg>
    ),
  },
];

function NavLink({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: { href: string; label: string; icon: React.ReactNode };
  active: boolean;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={item.href}
      prefetch={false}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
        collapsed ? "justify-center px-2" : ""
      } ${
        active
          ? "text-white font-medium"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
      style={active ? { background: "linear-gradient(135deg, #0d9488, #0f766e)" } : undefined}
      title={collapsed ? item.label : undefined}
    >
      {item.icon}
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

function NavSection({
  title,
  collapsed,
  children,
}: {
  title: string;
  collapsed: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      {!collapsed && (
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{title}</p>
      )}
      {children}
    </div>
  );
}

export default function Sidebar() {
  const currentUser = useCurrentUser();
  const { collapsed, mobileOpen, setMobileOpen } = useSidebarLayout();
  const pathname = usePathname();
  const [forumOpen, setForumOpen] = useState(false);
  const [forumName, setForumName] = useState("");
  const [forumDescription, setForumDescription] = useState("");
  const [creatingForum, setCreatingForum] = useState(false);
  const [forumNameError, setForumNameError] = useState<string | null>(null);

  const roleNav = useMemo(() => {
    const role = currentUser?.role ?? "";
    const items: { href: string; label: string; icon: React.ReactNode }[] = [];
    if (role === "moderator") {
      items.push({
        href: "/moderation/queue",
        label: "Moderation",
        icon: (
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        ),
      });
    }
    if (role === "admin") {
      items.push({
        href: "/admin",
        label: "Admin",
        icon: (
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
      });
    }
    return items;
  }, [currentUser?.role]);

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    if (href === "/forums") {
      return pathname === "/forums" || pathname.startsWith("/forums/");
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  useEffect(() => {
    if (!mobileOpen) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [mobileOpen, setMobileOpen]);

  const closeMobile = () => setMobileOpen(false);
  const showCreateForum = canCreateForum(currentUser?.role);

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 top-14 bg-black/40 z-30 md:hidden"
          onClick={closeMobile}
          aria-hidden
        />
      )}

      <aside
        className={`fixed left-0 top-14 z-30 flex h-[calc(100vh-3.5rem)] flex-col border-r border-gray-200 bg-white transition-all duration-300 ${
          collapsed ? "w-16" : "w-56"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
        style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}
      >
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          <NavSection title="Home" collapsed={collapsed}>
            {primaryNav.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(item.href)}
                collapsed={collapsed}
                onNavigate={closeMobile}
              />
            ))}
            {showCreateForum && !collapsed && (
              <button
                type="button"
                onClick={() => setForumOpen(true)}
                className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <Plus className="w-5 h-5 shrink-0" />
                Create forum
              </button>
            )}
            {showCreateForum && collapsed && (
              <button
                type="button"
                onClick={() => setForumOpen(true)}
                className="mt-1 flex w-full items-center justify-center rounded-lg px-2 py-2.5 text-gray-600 hover:bg-gray-50"
                title="Create forum"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </NavSection>

          <div className="border-t border-gray-100 pt-3">
            <NavSection title="Private" collapsed={collapsed}>
              {secondaryNav.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={isActive(item.href)}
                  collapsed={collapsed}
                  onNavigate={closeMobile}
                />
              ))}
            </NavSection>
          </div>

          {roleNav.length > 0 && (
            <div className="border-t border-gray-100 pt-3">
              <NavSection title="Staff" collapsed={collapsed}>
                {roleNav.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    active={isActive(item.href)}
                    collapsed={collapsed}
                    onNavigate={closeMobile}
                  />
                ))}
              </NavSection>
            </div>
          )}
        </nav>
      </aside>

      {forumOpen && (
        <div
          className="fixed inset-0 z-60 bg-black/40 p-4 flex items-center justify-center"
          onClick={() => setForumOpen(false)}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900">Create forum</h3>
            <p className="text-sm text-gray-500 mt-1">
              Forums should be course/topic based and meaningful (e.g. Computer Science).
            </p>
            <label className="mt-4 block text-xs font-medium text-gray-600">Forum name</label>
            <input
              value={forumName}
              onChange={(e) => {
                setForumName(e.target.value);
                setForumNameError(null);
              }}
              placeholder="e.g. Computer Science"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            {forumNameError && <p className="mt-1 text-xs text-red-500">{forumNameError}</p>}
            <p className="mt-1 text-xs text-gray-400">
              Letters, numbers, spaces, hyphens, apostrophes, and ampersands only.
            </p>
            <label className="mt-3 block text-xs font-medium text-gray-600">Description</label>
            <textarea
              value={forumDescription}
              onChange={(e) => setForumDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setForumOpen(false)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
              >
                Cancel
              </button>
              <button
                disabled={creatingForum}
                onClick={async () => {
                  if (!forumName.trim()) return;
                  if (!/^[a-zA-Z0-9\s&'-]+$/.test(forumName.trim()) || forumName.trim().length < 2) {
                    setForumNameError(
                      "Name can only contain letters, numbers, spaces, hyphens, apostrophes, and ampersands."
                    );
                    return;
                  }
                  setCreatingForum(true);
                  try {
                    const res = await fetch("/api/categories", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({
                        name: forumName.trim(),
                        description: forumDescription.trim() || "Forum topic",
                        slug: forumName.trim().toLowerCase().replace(/\s+/g, "-"),
                      }),
                    });
                    if (!res.ok) throw new Error();
                    setForumOpen(false);
                    setForumName("");
                    setForumDescription("");
                  } catch {
                    alert("Failed to create forum.");
                  } finally {
                    setCreatingForum(false);
                  }
                }}
                className="rounded-lg bg-teal-600 px-3 py-2 text-sm text-white disabled:opacity-60"
              >
                {creatingForum ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
