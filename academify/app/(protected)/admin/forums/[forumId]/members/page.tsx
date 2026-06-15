"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminBackLink } from "@/components/admin-back-link";

type ForumMemberRow = {
  userId: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
  isModerator: boolean;
};

export default function ForumMembersPage() {
  const { forumId } = useParams<{ forumId: string }>();
  const [members, setMembers] = useState<ForumMemberRow[]>([]);
  const [forumName, setForumName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!forumId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [membersRes, categoriesRes] = await Promise.all([
          fetch(`/api/forums/${forumId}/members`, { credentials: "include" }),
          fetch("/api/categories", { credentials: "include" }),
        ]);
        const membersData = await membersRes.json().catch(() => ({}));
        const categoriesData = await categoriesRes.json().catch(() => ({}));

        if (!membersRes.ok) {
          throw new Error(membersData?.error?.message || "Failed to load members");
        }

        const forum = (categoriesData.categories ?? []).find(
          (c: { id: string }) => c.id === forumId
        );
        if (!cancelled) {
          setForumName(forum?.name ?? "Forum");
          setMembers(membersData.members ?? []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load members");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [forumId]);

  const toggleModerator = async (userId: string, isModerator: boolean) => {
    setSaving((prev) => ({ ...prev, [userId]: true }));
    try {
      const res = await fetch(`/api/forums/${forumId}/members`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId, isModerator: !isModerator }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error?.message || "Failed to update moderator");
      setMembers((prev) =>
        prev.map((m) => (m.userId === userId ? { ...m, isModerator: !isModerator } : m))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update moderator");
    } finally {
      setSaving((prev) => ({ ...prev, [userId]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <AdminBackLink href="/admin/forums" label="Back to forums" />
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-gray-900">{forumName} — Members</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage who moderates this forum. Moderator is per-forum — not a global role.
          Student and lecturer are platform titles only.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        {loading ? (
          <p className="text-sm text-gray-500">Loading members…</p>
        ) : members.length === 0 ? (
          <p className="text-sm text-gray-500">No members yet. Users appear here after joining.</p>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-gray-500">
                <tr>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Joined</th>
                  <th className="py-2 pr-4">Forum role</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {members.map((member) => (
                  <tr key={member.userId} className="border-t border-gray-100">
                    <td className="py-3 pr-4 font-medium text-gray-900">{member.name}</td>
                    <td className="py-3 pr-4">{member.email}</td>
                    <td className="py-3 pr-4 capitalize">{member.role}</td>
                    <td className="py-3 pr-4 text-xs text-gray-500">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => toggleModerator(member.userId, member.isModerator)}
                        disabled={saving[member.userId]}
                        className={`rounded-lg border px-3 py-1 text-xs font-semibold disabled:opacity-60 ${
                          member.isModerator
                            ? "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {saving[member.userId]
                          ? "Saving..."
                          : member.isModerator
                            ? "Moderator"
                            : "Make moderator"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Platform admins can manage all forums from{" "}
        <Link href="/admin/users" className="text-teal-600 hover:underline">
          Admin Users
        </Link>{" "}
        (student / lecturer / admin only).
      </p>
    </div>
  );
}
