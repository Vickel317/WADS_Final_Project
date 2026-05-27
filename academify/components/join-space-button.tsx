"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type JoinSpaceButtonProps = {
  spaceId: string;
  isMember: boolean;
};

export default function JoinSpaceButton({ spaceId, isMember }: JoinSpaceButtonProps) {
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(isMember);

  const handleJoin = async () => {
    if (joining || joined) return;

    setJoining(true);
    try {
      const res = await fetch(`/api/collaboration/${spaceId}`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to join space");
      }

      setJoined(true);
      window.dispatchEvent(new Event("spaces-updated"));
      // Notify any listeners specifically that this user just joined a space
      window.dispatchEvent(new CustomEvent("space-joined", { detail: { spaceId } }));
      router.push(`/messages/space-${spaceId}`);
    } catch {
      alert("Failed to join space");
    } finally {
      setJoining(false);
    }
  };

  return (
    <button
      onClick={handleJoin}
      disabled={joining || joined}
      className="rounded-full bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {joined ? "Joined" : joining ? "Joining..." : "Join space"}
    </button>
  );
}