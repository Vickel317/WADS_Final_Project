"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSmartBack } from "@/components/back-button";

type EventActionsProps = {
  eventId: string;
  isHost: boolean;
  isAttending: boolean;
};

export default function EventActions({ eventId, isHost, isAttending }: EventActionsProps) {
  const router = useRouter();
  const goBack = useSmartBack("/events");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleRsvp = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: isAttending ? "DELETE" : "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update RSVP");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update RSVP");
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async () => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete event");
      }
      goBack();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {isHost ? (
          <>
            <span className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700">
              You&apos;re hosting
            </span>
            <Link
              href={`/events/${eventId}/edit`}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Edit Event
            </Link>
            <button
              type="button"
              onClick={deleteEvent}
              disabled={loading}
              className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
            >
              Delete Event
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={toggleRsvp}
            disabled={loading}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition disabled:opacity-60 ${
              isAttending
                ? "border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100"
                : "bg-teal-600 text-white hover:bg-teal-700"
            }`}
          >
            {isAttending ? "Cancel RSVP" : "Join Event"}
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
