import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-session";
import { handleApiError } from "@/lib/error-handler";
import { validateCreateEventPayload } from "@/lib/security";

const mockEvents = [
  {
    id: "event_1",
    userId: "user_1",
    title: "JavaScript Study Session",
    description: "Advanced JavaScript patterns and best practices discussion",
    date: new Date("2026-03-15T14:00:00Z"),
    duration: 120,
    location: "Library - Room 301",
    category: "Study Session",
    maxAttendees: 20,
    attendees: ["user_1", "user_3", "user_4"],
    status: "scheduled",
    createdAt: new Date("2026-03-10T10:00:00Z"),
    updatedAt: new Date("2026-03-10T10:00:00Z"),
  },
  {
    id: "event_2",
    userId: "user_1",
    title: "Midterm Review Session",
    description: "Review key concepts for upcoming midterm exam",
    date: new Date("2026-03-18T16:00:00Z"),
    duration: 90,
    location: "Student Center",
    category: "Exam Prep",
    maxAttendees: 15,
    attendees: ["user_1", "user_2", "user_5"],
    status: "scheduled",
    createdAt: new Date("2026-03-01T10:00:00Z"),
    updatedAt: new Date("2026-03-01T10:00:00Z"),
  },
  {
    id: "event_3",
    userId: "user_2",
    title: "Calculus Workshop",
    description: "Practice problems and solutions for calculus optimization",
    date: new Date("2026-03-20T10:00:00Z"),
    duration: 60,
    location: "Math Building - Room 205",
    category: "Workshop",
    maxAttendees: 25,
    attendees: ["user_2", "user_1"],
    status: "completed",
    createdAt: new Date("2026-02-20T10:00:00Z"),
    updatedAt: new Date("2026-02-20T10:00:00Z"),
  },
];

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const filter = url.searchParams.get("filter");
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = 10;

    let filteredEvents = [...mockEvents];

    if (filter === "upcoming") {
      filteredEvents = filteredEvents.filter((event) => new Date(event.date) > new Date());
    } else if (filter === "past") {
      filteredEvents = filteredEvents.filter((event) => new Date(event.date) <= new Date());
    }

    filteredEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const total = filteredEvents.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return NextResponse.json(
      {
        data: filteredEvents.slice(start, end),
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError("Get events error:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request.headers);
    if (!sessionUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = validateCreateEventPayload(body);
    if (!validationResult.ok) {
      return NextResponse.json({ error: validationResult.error }, { status: 400 });
    }

    const { title, description, date, duration, location, category, maxAttendees } =
      validationResult.data;

    const newEvent = {
      id: `event_${Date.now()}`,
      userId: sessionUser.user.userId,
      title,
      description: description || "",
      date: new Date(date),
      duration: duration || 60,
      location,
      category: category || "General",
      maxAttendees: maxAttendees || 30,
      attendees: [sessionUser.user.userId],
      status: "scheduled",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockEvents.push(newEvent);

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    return handleApiError("Create event error:", error);
  }
}
