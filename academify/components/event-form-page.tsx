"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export type EventType = "Study Session" | "Workshop" | "Seminar" | "Social";

export type EventFormState = {
  title: string;
  type: EventType;
  date: string;
  time: string;
  location: string;
  maxParticipants: string;
  description: string;
  virtualLink: string;
  forumID: string;
  bannerFile: File | null;
};

type ForumOption = { id: string; name: string; slug: string };

type EventFormPageProps = {
  mode: "create" | "edit";
  eventId?: string;
  initialValues?: Partial<EventFormState>;
  heading: string;
  subheading?: string;
  submitLabel: string;
  cancelHref: string;
};

const EMPTY_FORM: EventFormState = {
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
};

const inputClass =
  "w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-teal-500 bg-gray-50 focus:bg-white transition";

export default function EventFormPage({
  mode,
  eventId,
  initialValues,
  heading,
  subheading,
  submitLabel,
  cancelHref,
}: EventFormPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState<EventFormState>({ ...EMPTY_FORM, ...initialValues });
  const [forums, setForums] = useState<ForumOption[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (ignore) return;
        const list = (data.categories ?? []).map((c: { id: string; name: string; slug: string }) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
        }));
        setForums(list);

        const forumSlug = searchParams.get("forum");
        if (mode === "create" && forumSlug) {
          const match = (data.categories ?? []).find(
            (c: { slug: string; id: string }) => c.slug === forumSlug
          );
          if (match) {
            const forumId = match.id;
            window.requestAnimationFrame(() => {
              setForm((prev) => (prev.forumID ? prev : { ...prev, forumID: forumId }));
            });
          }
        }
      })
      .catch(() => {
        if (!ignore) setLoadError("Failed to load forums.");
      });
    return () => {
      ignore = true;
    };
  }, [mode, searchParams]);

  const updateForm = (updates: Partial<EventFormState>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.title.trim() || !form.location.trim() || !form.date || !form.time) {
      setFormError("Title, location, date, and time are required.");
      return;
    }

    if (!form.forumID) {
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

    const descriptionValue = (() => {
      const base = form.description.trim();
      if (!trimmedLink) return base;
      return base ? `${base}\n\n${trimmedLink}` : trimmedLink;
    })();

    setLoading(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: descriptionValue,
        date: dateTime.toISOString(),
        location: form.location.trim(),
        category: form.type,
        forumID: form.forumID,
        maxAttendees: form.maxParticipants ? Number(form.maxParticipants) : undefined,
      };

      const res = await fetch(mode === "create" ? "/api/events" : `/api/events/${eventId}`, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || data.message || "Failed to save event");
      }

      const savedId = mode === "create" ? data.id : eventId;
      if (form.bannerFile && savedId) {
        const fd = new FormData();
        fd.append("file", form.bannerFile);
        await fetch(`/api/storage/upload-entity-banner/event/${savedId}`, {
          method: "POST",
          body: fd,
        });
      }

      router.push(savedId ? `/events/${savedId}` : "/events");
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push(cancelHref)}
          className="flex h-8 w-8 items-center justify-center rounded-xl transition hover:bg-gray-100"
        >
          <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{heading}</h1>
          {subheading && <p className="mt-0.5 text-sm text-gray-400">{subheading}</p>}
          {loadError && <p className="mt-1 text-xs text-red-500">{loadError}</p>}
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-gray-100 bg-white p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Event Title
            </label>
            <input
              placeholder="e.g. Algorithms Study Group"
              value={form.title}
              onChange={(e) => updateForm({ title: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Type
              </label>
              <select
                className={`${inputClass} bg-white`}
                value={form.type}
                onChange={(e) => updateForm({ type: e.target.value as EventType })}
              >
                <option value="Study Session">Study Session</option>
                <option value="Workshop">Workshop</option>
                <option value="Seminar">Seminar</option>
                <option value="Social">Social</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Forum
              </label>
              <select
                className={`${inputClass} bg-white`}
                value={form.forumID}
                onChange={(e) => updateForm({ forumID: e.target.value })}
              >
                <option value="">Select a forum</option>
                {forums.map((forum) => (
                  <option key={forum.id} value={forum.id}>
                    {forum.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Date
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => updateForm({ date: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Time
              </label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => updateForm({ time: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Location
            </label>
            <input
              placeholder="e.g. Library Room 203 or Online (Zoom)"
              value={form.location}
              onChange={(e) => updateForm({ location: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Max Participants
            </label>
            <input
              type="number"
              placeholder="e.g. 20"
              value={form.maxParticipants}
              onChange={(e) => updateForm({ maxParticipants: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Description
            </label>
            <textarea
              rows={4}
              placeholder="What will you cover?"
              value={form.description}
              onChange={(e) => updateForm({ description: e.target.value })}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Virtual Link (optional)
            </label>
            <input
              placeholder="https://meet.google.com/..."
              value={form.virtualLink}
              onChange={(e) => updateForm({ virtualLink: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Banner Image (optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => updateForm({ bannerFile: e.target.files?.[0] ?? null })}
              className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-1 file:text-xs file:font-medium file:text-teal-700 hover:file:bg-teal-100`}
            />
          </div>

          {formError && <p className="text-sm text-red-500">{formError}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push(cancelHref)}
              disabled={loading}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-teal-600 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
            >
              {loading ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
