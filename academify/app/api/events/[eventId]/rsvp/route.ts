import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Mock events database
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

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string };
  } catch {
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    // Verify authentication
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { eventId } = params;

    const eventIndex = mockEvents.findIndex((e) => e.id === eventId);
    if (eventIndex === -1) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    const event = mockEvents[eventIndex];

    // Check if already attending
    if (event.attendees.includes(decoded.id)) {
      return NextResponse.json(
        { error: "You are already attending this event" },
        { status: 400 }
      );
    }

    // Check capacity
    if (event.attendees.length >= event.maxAttendees) {
      return NextResponse.json(
        { error: "Event is at maximum capacity" },
        { status: 400 }
      );
    }

    // Add attendee
    event.attendees.push(decoded.id);
    event.updatedAt = new Date();

    return NextResponse.json(
      {
        message: "Successfully RSVP'd to event",
        event,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("RSVP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    // Verify authentication
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { eventId } = params;

    const eventIndex = mockEvents.findIndex((e) => e.id === eventId);
    if (eventIndex === -1) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    const event = mockEvents[eventIndex];

    // Check if attending
    const attendeeIndex = event.attendees.indexOf(decoded.id);
    if (attendeeIndex === -1) {
      return NextResponse.json(
        { error: "You are not attending this event" },
        { status: 400 }
      );
    }

    // Remove attendee
    event.attendees.splice(attendeeIndex, 1);
    event.updatedAt = new Date();

    return NextResponse.json(
      {
        message: "Successfully cancelled RSVP",
        event,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Cancel RSVP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
