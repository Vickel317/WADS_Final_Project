"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  EVENT_PAST_DATE_MESSAGE,
  isEventDateInPast,
  todayDateInputValue,
} from "@/lib/event-form-utils";
import {
  Plus,
  Calendar,
  Clock,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";


interface Event {
  id: string;
  title: string;
  type: "Study Session" | "Workshop" | "Seminar" | "Social";
  date: string;
  time: string;
  location: string;
  host: string;
  hostUsername?: string;
  participants: number;
  maxParticipants: number;
  joined?: boolean;
  durationMinutes?: number;
  startsAt?: Date;
  creatorId?: string;
  attendeeIds?: string[];
}



const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const TYPE_STYLES: Record<Event["type"], { badge: string; border: string; dot: string }> = {
  "Study Session": {
    badge: "bg-teal-500 text-white",
    border: "border-teal-200",
    dot: "bg-teal-500",
  },
  Workshop: { badge: "bg-indigo-500 text-white", border: "border-indigo-200", dot: "bg-indigo-500" },
  Seminar: { badge: "bg-amber-500 text-white", border: "border-amber-200", dot: "bg-amber-500" },
  Social: { badge: "bg-pink-500 text-white", border: "border-pink-200", dot: "bg-pink-500" },
};

const formatGCalDate = (value: Date) =>
  value
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");

const buildGoogleCalendarUrl = (event: Event) => {
  if (!event.startsAt) return null;
  const start = event.startsAt;
  const durationMinutes = event.durationMinutes ?? 60;
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  const details = [event.location, event.time].filter(Boolean).join(" | ");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${formatGCalDate(start)}/${formatGCalDate(end)}`,
    details,
    location: event.location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

type ApiEvent = {
  id: string;
  userId?: string;
  title: string;
  description: string;
  date: string;
  location: string;
  category?: string;
  duration?: number;
  attendees?: string[];
  maxAttendees?: number;
  forumId?: string;
  creator?: {
    id: string;
    name: string;
    username: string;
  };
};


function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function mapApiEvent(event: ApiEvent, userId: string | null): Event {
  const when = new Date(event.date);
  const attendeeIds = event.attendees ?? [];
  return {
    id: event.id,
    creatorId: event.userId ?? event.creator?.id,
    title: event.title,
    type: (() => {
      if (!event.category) return "Study Session" as const;
      const normalized = event.category.toLowerCase();
      if (normalized.includes("workshop")) return "Workshop" as const;
      if (normalized.includes("seminar")) return "Seminar" as const;
      if (normalized.includes("social")) return "Social" as const;
      return "Study Session" as const;
    })(),
    date: when.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: when.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }),
    location: event.location,
    host: event.creator?.name ?? "Host",
    hostUsername: event.creator?.username,
    participants: attendeeIds.length,
    maxParticipants: event.maxAttendees ?? 0,
    durationMinutes: event.duration ?? 60,
    startsAt: when,
    attendeeIds,
    joined: userId ? attendeeIds.includes(userId) : false,
  };
}


function StatCard({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-5 px-4">
      <span className="text-3xl font-bold text-gray-900">{value}</span>
      <span className="text-sm text-gray-400 mt-1">{label}</span>
    </div>
  );
}

function EventCard({
  event,
  currentUserId,
  onToggleRsvp,
  onDeleteEvent,
  onOpen,
  rsvpLoading,
}: {
  event: Event;
  currentUserId: string | null;
  onToggleRsvp: (id: string) => void;
  onDeleteEvent: (id: string) => void;
  onOpen: (id: string) => void;
  rsvpLoading: boolean;
}) {
  const styles = TYPE_STYLES[event.type];
  const hasCap = event.maxParticipants > 0;
  const full = hasCap && event.participants >= event.maxParticipants;
  const hostInitial = event.host?.slice(0, 1).toUpperCase() || "?";
  const gcalUrl = buildGoogleCalendarUrl(event);
  const isHost = Boolean(currentUserId && event.creatorId === currentUserId);

  return (
    <div
      onClick={() => onOpen(event.id)}
      className={`bg-white rounded-xl border ${styles.border} p-4 hover:shadow-sm transition-shadow cursor-pointer`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${styles.badge}`}
            >
              {event.type}
            </span>
            <span className="min-w-0 text-base font-semibold text-gray-900 break-words">
              {event.title}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar size={12} className="shrink-0" />
              {event.date}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock size={12} className="shrink-0" />
              {event.time}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <MapPin size={12} className="shrink-0" />
              <span className="break-words">{event.location}</span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[9px] font-bold text-gray-500">
                  {hostInitial}
                </div>
                <span>by {event.host}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users size={11} className="shrink-0" />
                <span>
                  {hasCap
                    ? `${event.participants}/${event.maxParticipants} participants`
                    : `${event.participants} participants`}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:min-w-[9.5rem]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isHost) {
                onDeleteEvent(event.id);
                return;
              }
              if (!full || event.joined) onToggleRsvp(event.id);
            }}
            disabled={rsvpLoading || (!isHost && full && !event.joined)}
            className={`w-full rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 sm:w-auto ${
              isHost
                ? "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                : event.joined
                ? "border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100"
                : full
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "text-white hover:opacity-90"
            }`}
            style={
              !isHost && !event.joined && !full ? { backgroundColor: "#0d9488" } : undefined
            }
          >
            {rsvpLoading
              ? "Saving..."
              : isHost
              ? "Delete Event"
              : event.joined
              ? "Cancel RSVP"
              : full
              ? "Full"
              : "Join"}
          </button>
          {gcalUrl && (
            <a
              href={gcalUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-center text-xs font-semibold text-gray-600 hover:border-teal-200 hover:text-teal-700 sm:w-auto"
            >
              Add to Google Calendar
            </a>
          )}
        </div>
      </div>

      {/* Participants bar */}
      {hasCap && (
        <div className="mt-3">
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all"
              style={{
                width: `${(event.participants / event.maxParticipants) * 100}%`,
                backgroundColor: "#0d9488",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}


type EventForm = {
  title: string;
  type: Event["type"];
  date: string;
  time: string;
  location: string;
  maxParticipants: string;
  description: string;
  virtualLink: string;
  forumID: string;
  bannerFile: File | null;
};

function CreateEventModal({
  form,
  onChange,
  onClose,
  onSubmit,
  loading,
  error,
  forums,
  lockedForum,
}: {
  form: EventForm;
  onChange: (updates: Partial<EventForm>) => void;
  onClose: () => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
  forums: Array<{ id: string; name: string }>;
  lockedForum?: { id: string; name: string } | null;
}) {
  const forumOptions = lockedForum ? [lockedForum] : forums;
  const forumSelectDisabled = Boolean(lockedForum);
  const activeForumId = lockedForum?.id ?? form.forumID;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/40 p-3 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="my-auto flex max-h-[min(90dvh,calc(100dvh-1.5rem))] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3 sm:px-6 sm:py-4">
          <h3 className="text-lg font-bold text-gray-900">Create Event</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Event Title
            </label>
            <input
              placeholder="e.g. Algorithms Study Group"
              value={form.title}
              onChange={(e) => onChange({ title: e.target.value })}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Type
            </label>
            <select
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-teal-500 bg-white"
              value={form.type}
              onChange={(e) =>
                onChange({ type: e.target.value as Event["type"] })
              }
            >
              <option value="Study Session">Study Session</option>
              <option value="Workshop">Workshop</option>
              <option value="Seminar">Seminar</option>
              <option value="Social">Social</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Forum
            </label>
            <select
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-teal-500 bg-white"
              value={activeForumId}
              onChange={(e) => onChange({ forumID: e.target.value })}
              disabled={forumSelectDisabled}
            >
              {!lockedForum && <option value="">Select a forum</option>}
              {forumOptions.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            {lockedForum && (
              <p className="mt-1 text-xs text-gray-500">
                Forum is locked because you started from a specific forum hub.
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">
                Date
              </label>
              <input
                type="date"
                value={form.date}
                min={todayDateInputValue()}
                onChange={(e) => onChange({ date: e.target.value })}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">
                Time
              </label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => onChange({ time: e.target.value })}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-teal-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Location
            </label>
            <input
              placeholder="e.g. Library Room 203 or Online (Zoom)"
              value={form.location}
              onChange={(e) => onChange({ location: e.target.value })}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Max Participants
            </label>
            <input
              type="number"
              placeholder="e.g. 20"
              value={form.maxParticipants}
              onChange={(e) => onChange({ maxParticipants: e.target.value })}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="What will you cover?"
              value={form.description}
              onChange={(e) => onChange({ description: e.target.value })}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-teal-500 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Banner Image (optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onChange({ bannerFile: e.target.files?.[0] ?? null })}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-teal-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Virtual Link (optional)
            </label>
            <input
              placeholder="https://meet.google.com/..."
              value={form.virtualLink}
              onChange={(e) => onChange({ virtualLink: e.target.value })}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-teal-500"
            />
          </div>
        </div>

        <div className="shrink-0 border-t border-gray-100 px-4 py-3 sm:px-6 sm:py-4">
          {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={loading}
              className="flex-1 rounded-lg py-2 text-sm font-medium text-white disabled:opacity-60"
              style={{ backgroundColor: "#0d9488" }}
            >
              {loading ? "Creating..." : "Create Event"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function EventsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const forumSlug = searchParams.get("forum");
  const [forumFilter, setForumFilter] = useState<{ id: string; name: string; slug: string } | null>(null);
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [modal, setModal] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [form, setForm] = useState<EventForm>({
    title: "",
    type: "Study Session",
    date: "",
    time: "",
    location: "",
    maxParticipants: "",
    description: "",
    virtualLink: "",
    forumID: "",
    bannerFile: null,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [forumsList, setForumsList] = useState<Array<{ id: string; name: string }>>([]);
  const [rsvpLoadingId, setRsvpLoadingId] = useState<string | null>(null);
  const [rsvpError, setRsvpError] = useState<string | null>(null);

  useEffect(() => {
    const shouldCreate = searchParams.get("create") === "true";
    if (!shouldCreate) return;

    // Avoid setting state in the effect body (lint rule)
    const id = window.requestAnimationFrame(() => {
      setModal(true);
      router.replace(`/events?forum=${forumSlug ?? ""}`);
    });

    return () => window.cancelAnimationFrame(id);
  }, [searchParams, forumSlug, router]);


  useEffect(() => {
    if (!forumSlug) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForumFilter(null);
      return;
    }
    let ignore = false;
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (ignore) return;
        const match = (data.categories ?? []).find(
          (c: { slug: string; id: string; name: string }) => c.slug === forumSlug
        );
        setForumFilter(match ? { id: match.id, name: match.name, slug: match.slug } : null);
      })
      .catch(() => setForumFilter(null));
    return () => {
      ignore = true;
    };
  }, [forumSlug]);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        setForumsList((data.categories ?? []).map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let ignore = false;
    const loadEvents = async () => {
      try {
        const [eventRes, userRes] = await Promise.all([
          fetch("/api/events?filter=upcoming"),
          fetch("/api/users/me"),
        ]);
        const data = await eventRes.json();
        let userId: string | null = null;
        if (userRes.ok) {
          const me = await userRes.json();
          userId = me.user?.userId ?? null;
          if (!ignore) setCurrentUserId(userId);
        }
        if (!eventRes.ok) return;

        const raw = data.data ?? [];
        const scoped = forumFilter
          ? raw.filter((event: ApiEvent) => event.forumId === forumFilter.id)
          : raw;

        const mapped = scoped.map((event: ApiEvent) => mapApiEvent(event, userId));

        if (!ignore) setEvents(mapped);
      } catch {
        // Swallow errors to keep the page usable.
      }
    };

    loadEvents();
    return () => {
      ignore = true;
    };
  }, [forumFilter]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const handleToggleRsvp = async (id: string) => {
    const event = events.find((e) => e.id === id);
    if (!event || !currentUserId) return;
    if (event.creatorId === currentUserId) return;

    const isAttending = Boolean(event.joined);
    const full =
      event.maxParticipants > 0 && event.participants >= event.maxParticipants;
    if (!isAttending && full) return;

    setRsvpLoadingId(id);
    setRsvpError(null);
    try {
      const res = await fetch(`/api/events/${id}/rsvp`, {
        method: isAttending ? "DELETE" : "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || data.message || "Failed to update RSVP");
      }

      const nextAttendeeIds = isAttending
        ? (event.attendeeIds ?? []).filter((userId) => userId !== currentUserId)
        : [...(event.attendeeIds ?? []), currentUserId];

      setEvents((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...e,
                joined: !isAttending,
                participants: nextAttendeeIds.length,
                attendeeIds: nextAttendeeIds,
              }
            : e
        )
      );
    } catch (err) {
      setRsvpError(err instanceof Error ? err.message : "Failed to update RSVP");
    } finally {
      setRsvpLoadingId(null);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    setRsvpLoadingId(id);
    setRsvpError(null);
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || data.message || "Failed to delete event");
      }
      setEvents((prev) => prev.filter((event) => event.id !== id));
    } catch (err) {
      setRsvpError(err instanceof Error ? err.message : "Failed to delete event");
    } finally {
      setRsvpLoadingId(null);
    }
  };

  const handleCreateEvent = async () => {
    setFormError(null);

    if (!form.title.trim() || !form.location.trim() || !form.date || !form.time) {
      setFormError("Title, location, date, and time are required.");
      return;
    }

    const forumID = forumFilter?.id ?? form.forumID;
    if (!forumID) {
      setFormError("Please select a forum.");
      return;
    }

    const trimmedLink = form.virtualLink.trim();
    if (trimmedLink && !/^https?:\/\//i.test(trimmedLink)) {
      setFormError("Virtual link must start with http:// or https://");
      return;
    }

    const dateTime = new Date(`${form.date}T${form.time}`);
    if (Number.isNaN(dateTime.getTime())) {
      setFormError("Please provide a valid date and time.");
      return;
    }
    if (isEventDateInPast(dateTime)) {
      setFormError(EVENT_PAST_DATE_MESSAGE);
      return;
    }

    const descriptionValue = (() => {
      const base = form.description.trim();
      if (!trimmedLink) return base;
      return base ? `${base}\n\n${trimmedLink}` : trimmedLink;
    })();

    setFormLoading(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: descriptionValue,
          date: dateTime.toISOString(),
          location: form.location,
          category: form.type,
          forumID,
          maxAttendees: form.maxParticipants ? Number(form.maxParticipants) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to create event");
      }

      if (form.bannerFile && data.id) {
        const fd = new FormData();
        fd.append("file", form.bannerFile);
        await fetch(`/api/storage/upload-entity-banner/event/${data.id}`, {
          method: "POST",
          body: fd,
        });
      }

      setModal(false);
      setForm({
        title: "",
        type: "Study Session",
        date: "",
        time: "",
        location: "",
        maxParticipants: "",
        description: "",
        virtualLink: "",
        forumID: forumFilter?.id ?? "",
        bannerFile: null,
      });
      setFormError(null);
      const refreshRes = await fetch("/api/events?filter=upcoming");
      const refreshed = await refreshRes.json();
      if (refreshRes.ok) {
        const mapped = (refreshed.data ?? []).map((event: ApiEvent) =>
          mapApiEvent(event, currentUserId)
        );
        setEvents(mapped);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setFormLoading(false);
    }
  };

  const stats = useMemo(() => {
    const upcomingCount = events.length;
    const organizedCount = currentUserId
      ? events.filter((event) => event.creatorId === currentUserId).length
      : 0;
    const attendedCount = currentUserId
      ? events.filter((event) => event.attendeeIds?.includes(currentUserId)).length
      : 0;
    const totalHours = events.reduce((sum, event) => {
      const minutes = event.durationMinutes ?? 60;
      return sum + minutes / 60;
    }, 0);

    return {
      upcomingCount,
      organizedCount,
      attendedCount,
      totalHours: Math.round(totalHours),
    };
  }, [events, currentUserId]);

  const upcomingSummary = useMemo(() => {
    const counts = events.reduce<Record<Event["type"], number>>(
      (acc, event) => {
        acc[event.type] = (acc[event.type] ?? 0) + 1;
        return acc;
      },
      {
        "Study Session": 0,
        Workshop: 0,
        Seminar: 0,
        Social: 0,
      }
    );
    return {
      total: events.length,
      counts,
    };
  }, [events]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, Event["type"][]> = {};
    for (const event of events) {
      const d = event.startsAt instanceof Date ? event.startsAt : new Date(event.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!map[key]) map[key] = [];
      if (!map[key].includes(event.type)) map[key].push(event.type);
    }
    return map;
  }, [events]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  return (
    <div className="min-w-0 max-w-full flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 sm:p-6">
      {forumFilter && (
        <div className="mb-4 rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800">
          Showing events for <strong>{forumFilter.name}</strong>.{" "}
          <Link href={`/forums/${forumFilter.slug}?tab=events`} className="underline font-medium">
            Back to forum
          </Link>
          {" · "}
          <Link href="/events" className="underline font-medium">
            All events
          </Link>
        </div>
      )}

      {!forumFilter && (
        <p className="mb-4 text-sm text-gray-500 rounded-xl border border-gray-100 bg-white px-4 py-3">
          Events belong to a forum. Open a forum and use the <strong>Events</strong> tab for the best experience.
        </p>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            {forumFilter ? `${forumFilter.name} — Events` : "Study Sessions & Events"}
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Forum-scoped calendar — create events from a forum hub when possible
          </p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="flex shrink-0 items-center justify-center gap-2 self-start rounded-lg px-4 py-2 text-sm font-medium text-white sm:self-auto"
          style={{ backgroundColor: "#0d9488" }}
        >
          <Plus size={16} /> Create Event
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard value={stats.attendedCount} label="Events Attended" />
        <StatCard value={stats.organizedCount} label="Events Organized" />
        <StatCard value={stats.upcomingCount} label="Upcoming" />
        <StatCard value={stats.totalHours} label="Total Hours" />
      </div>

      {/* Body */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Calendar */}
        <div className="w-full lg:w-64 lg:shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Calendar</p>

            {/* Month nav */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={prevMonth}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-sm font-semibold text-gray-800">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <button
                onClick={nextMonth}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map((d) => (
                <div
                  key={d}
                  className="text-center text-[10px] font-medium text-gray-400 py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`blank-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayTypes = eventsByDate[dateKey] ?? [];
                return (
                  <div key={day} className="flex flex-col items-center">
                    <button
                      className="w-8 h-8 flex items-center justify-center rounded-full text-xs font-medium text-gray-700 transition-all duration-150 hover:text-white"
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#0d9488"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = ""; }}
                    >
                      {day}
                    </button>
                    {dayTypes.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5 h-1.5">
                        {dayTypes.slice(0, 4).map((t, idx) => (
                          <span key={idx} className={`w-1.5 h-1.5 rounded-full ${TYPE_STYLES[t].dot}`} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* This week summary */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-700 mb-2">
                Upcoming Summary
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                  {upcomingSummary.total} events
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                  {upcomingSummary.counts.Workshop} workshops
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  {upcomingSummary.counts.Seminar} seminars
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0" />
                  {upcomingSummary.counts.Social} socials
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  {upcomingSummary.counts["Study Session"]} study sessions
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming events */}
        <div className="flex-1 min-w-0 w-full">
          <p className="text-sm font-semibold text-gray-700 mb-3">Upcoming</p>
          {rsvpError && (
            <p className="mb-3 text-sm text-red-500 rounded-lg border border-red-100 bg-red-50 px-3 py-2">
              {rsvpError}
            </p>
          )}
          <div className="space-y-3">
            {events.length === 0 ? (
              <p className="text-sm text-gray-500">No upcoming events yet.</p>
            ) : (
              events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  currentUserId={currentUserId}
                  onToggleRsvp={handleToggleRsvp}
                  onDeleteEvent={handleDeleteEvent}
                  onOpen={(id) => router.push(`/events/${id}`)}
                  rsvpLoading={rsvpLoadingId === event.id}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <CreateEventModal
          form={form}
          onChange={(updates) => setForm((prev) => ({ ...prev, ...updates }))}
          onClose={() => setModal(false)}
          onSubmit={handleCreateEvent}
          loading={formLoading}
          error={formError}
          forums={forumsList}
          lockedForum={forumFilter ? { id: forumFilter.id, name: forumFilter.name } : null}
        />
      )}
    </div>
  );
}