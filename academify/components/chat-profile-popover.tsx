"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

interface MiniProfile {
  id: string;
  username: string;
  name: string;
  role: string;
  major: string;
  year: string;
  bio: string;
  avatarUrl: string | null;
  skills: string[];
}

const roleBadge: Record<string, { label: string; bg: string; text: string }> = {
  student: { label: "Student", bg: "bg-blue-50", text: "text-blue-700" },
  lecturer: { label: "Lecturer", bg: "bg-purple-50", text: "text-purple-700" },
  admin: { label: "Admin", bg: "bg-amber-50", text: "text-amber-700" },
};

export function ChatProfilePopover({
  userId,
  children,
  side = "bottom",
}: {
  userId: string;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<MiniProfile | null>(null);
  const loading = open && profile === null;

  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || profile) return;
    let active = true;

    // Avoid calling setState synchronously in an effect body (lint)
    // setLoading will be toggled after the fetch starts (avoid linted sync setState)
    fetch(`/api/users/${userId}`)
      .finally(() => {
        window.requestAnimationFrame(() => setLoading(false));
      });

    window.requestAnimationFrame(() => setLoading(true));
    fetch(`/api/users/${userId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!active || !d?.user) return;
        const u = d.user;
        setProfile({
          id: String(u.id ?? ""),
          username: String(u.username ?? ""),
          name: String(u.name ?? "User"),
          role: String(u.role ?? "student"),
          major: String(u.major ?? ""),
          year: String(u.year ?? ""),
          bio: String(u.bio ?? ""),
          avatarUrl: u.avatarUrl ?? null,
          skills: Array.isArray(u.skills) ? u.skills.map((s: unknown) => String(s)) : [],
        });
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, profile, userId]);


  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const positionClasses =
    side === "top"
      ? "bottom-full left-1/2 -translate-x-1/2 mb-2"
      : side === "bottom"
      ? "top-full left-1/2 -translate-x-1/2 mt-2"
      : side === "left"
      ? "right-full top-1/2 -translate-y-1/2 mr-2"
      : "left-full top-1/2 -translate-y-1/2 ml-2";

  const badge = roleBadge[profile?.role ?? "student"] ?? roleBadge.student;

  return (
    <div className="relative" ref={triggerRef}>
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {children}
      </div>

      {open && (
        <div
          ref={popoverRef}
          className={`absolute z-50 ${positionClasses} w-64 bg-white rounded-2xl border border-gray-100 shadow-xl p-4 animate-in fade-in zoom-in-95 duration-150`}
          onClick={(e) => e.stopPropagation()}
        >
          {loading && !profile ? (
            <div className="flex items-center justify-center py-6">
              <div className="w-6 h-6 rounded-full border-2 border-teal-200 border-t-teal-600 animate-spin" />
            </div>
          ) : profile ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-full bg-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                  {profile.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 truncate">{profile.name}</p>
                  {profile.username && (
                    <p className="text-xs text-gray-400 truncate">@{profile.username}</p>
                  )}
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase shrink-0 ${badge.bg} ${badge.text}`}>
                  {badge.label}
                </span>
              </div>

              {profile.major && (
                <p className="text-xs text-teal-600 font-medium mb-1.5">
                  {profile.major}{profile.year ? ` · ${profile.year}` : ""}
                </p>
              )}

              {profile.bio && (
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">{profile.bio}</p>
              )}

              {profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {profile.skills.slice(0, 4).map((skill) => (
                    <span key={skill} className="px-2 py-0.5 rounded text-[10px] font-medium text-teal-700 bg-teal-50">
                      {skill}
                    </span>
                  ))}
                  {profile.skills.length > 4 && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium text-gray-400 bg-gray-50">
                      +{profile.skills.length - 4}
                    </span>
                  )}
                </div>
              )}

              <Link
                href={`/profile/${profile.id}`}
                onClick={() => setOpen(false)}
                className="block w-full text-center py-2 rounded-xl text-xs font-medium text-teal-600 border border-teal-200 hover:bg-teal-50 transition"
              >
                View full profile
              </Link>
            </>
          ) : (
            <p className="text-xs text-gray-400 text-center py-4">Profile not found</p>
          )}
        </div>
      )}
    </div>
  );
}
