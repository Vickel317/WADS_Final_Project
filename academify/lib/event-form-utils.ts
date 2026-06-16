import type { EventFormState, EventType } from "@/components/event-form-page";

const parseEventType = (category: string): EventType => {
  const normalized = category.toLowerCase();
  if (normalized.includes("workshop")) return "Workshop";
  if (normalized.includes("seminar")) return "Seminar";
  if (normalized.includes("social")) return "Social";
  return "Study Session";
};

export const parseCategoryFromTitle = (title: string) => {
  const match = title.match(/^\[(.+?)\]\s*(.+)$/);
  if (!match) {
    return { type: "Study Session" as EventType, title };
  }
  return { type: parseEventType(match[1]), title: match[2] };
};

export const splitDescriptionAndLink = (description: string) => {
  const linkMatch = description.match(/https?:\/\/[^\s]+/i);
  const virtualLink = linkMatch ? linkMatch[0] : "";
  const base = virtualLink
    ? description.replace(virtualLink, "").replace(/\n\n+/g, "\n").trim()
    : description;
  return { description: base, virtualLink };
};

export const toLocalDateInput = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const toLocalTimeInput = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const eventToFormState = (event: {
  title: string;
  description: string;
  dateTime: Date;
  location: string;
  forumID: string;
}): EventFormState => {
  const parsed = parseCategoryFromTitle(event.title);
  const { description, virtualLink } = splitDescriptionAndLink(event.description);
  const when = new Date(event.dateTime);

  return {
    title: parsed.title,
    type: parsed.type,
    date: toLocalDateInput(when),
    time: toLocalTimeInput(when),
    location: event.location,
    maxParticipants: "",
    description,
    virtualLink,
    forumID: event.forumID,
    bannerFile: null,
  };
};
