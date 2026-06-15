"use client";

import { useState } from "react";

const actionButtonClass =
  "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";

const actionButtonStyle = { background: "linear-gradient(135deg, #0d9488, #0f766e)" };

type JoinForumButtonProps = {
  forumId: string;
  isMember: boolean;
  onMembershipChange?: (isMember: boolean, memberCount: number) => void;
};

export default function JoinForumButton({
  forumId,
  isMember,
  onMembershipChange,
}: JoinForumButtonProps) {
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const handleJoin = async () => {
    if (joining || isMember) return;
    setJoining(true);
    try {
      const res = await fetch(`/api/forums/${forumId}/membership`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error("Failed to join forum");
      const nextCount =
        typeof data.memberCount === "number" ? data.memberCount : undefined;
      onMembershipChange?.(true, nextCount ?? 0);
    } catch {
      alert("Failed to join forum");
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (leaving || !isMember) return;
    if (!confirm("Leave this forum? You can rejoin anytime.")) return;
    setLeaving(true);
    try {
      const res = await fetch(`/api/forums/${forumId}/membership`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error("Failed to leave forum");
      const nextCount =
        typeof data.memberCount === "number" ? data.memberCount : undefined;
      onMembershipChange?.(false, nextCount ?? 0);
    } catch {
      alert("Failed to leave forum");
    } finally {
      setLeaving(false);
    }
  };

  if (isMember) {
    return (
      <button
        type="button"
        onClick={handleLeave}
        disabled={leaving}
        className={actionButtonClass}
        style={actionButtonStyle}
      >
        {leaving ? "Leaving..." : "Joined"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleJoin}
      disabled={joining}
      className={actionButtonClass}
      style={actionButtonStyle}
    >
      {joining ? "Joining..." : "Join forum"}
    </button>
  );
}

export function formatMemberCount(count: number) {
  return `${count} member${count === 1 ? "" : "s"}`;
}
