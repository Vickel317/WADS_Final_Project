import { NextRequest, NextResponse } from "next/server";

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

// Mock users database
const mockUsers = [
  {
    id: "user_1",
    email: "john@example.com",
    name: "John Doe",
    role: "student",
    bio: "Computer Science student",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
  },
  {
    id: "user_2",
    email: "sarah@example.com",
    name: "Sarah Chen",
    role: "instructor",
    bio: "Mathematics Instructor",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
  },
  {
    id: "user_3",
    email: "mike@example.com",
    name: "Mike Johnson",
    role: "student",
    bio: "Engineering student",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
  },
  {
    id: "user_4",
    email: "emma@example.com",
    name: "Emma Wilson",
    role: "student",
    bio: "Business student",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
  },
  {
    id: "user_5",
    email: "alex@example.com",
    name: "Alex Rivera",
    role: "student",
    bio: "Psychology student",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
  },
];

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params;

    const event = mockEvents.find((e) => e.id === eventId);
    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Get attendee details
    const attendeesDetails = event.attendees
      .map((userId) => mockUsers.find((u) => u.id === userId))
      .filter((user) => user !== undefined);

    return NextResponse.json(
      {
        eventId,
        eventTitle: event.title,
        totalAttendees: event.attendees.length,
        maxAttendees: event.maxAttendees,
        attendees: attendeesDetails,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get attendees error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
