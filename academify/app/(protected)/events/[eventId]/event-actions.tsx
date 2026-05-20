"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type EventActionsProps = {
  eventId: string;
  isHost: boolean;
  isAttending: boolean;
};

export default function EventActions({ eventId, isHost, isAttending }: EventActionsProps) {
  const router = useRouter();
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
    if (!confirm("Delete this event? This cannot be undone.")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete event");
      }
      router.push("/events");
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
        {isHost && (
          <button
            type="button"
            onClick={deleteEvent}
            disabled={loading}
            className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
          >
            Delete Event
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
