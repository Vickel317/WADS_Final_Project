import { NextRequest, NextResponse } from "next/server";

// Mock events data
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
    participants: ["user_1", "user_3", "user_4"],
    status: "scheduled",
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
    participants: ["user_1", "user_2", "user_5"],
    status: "scheduled",
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
    participants: ["user_2", "user_1"],
    status: "completed",
  },
];

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    // Filter events by user
    let userEvents = mockEvents.filter((event) => event.userId === userId);

    // Filter by status if provided
    if (status) {
      userEvents = userEvents.filter((event) => event.status === status);
    }

    if (userEvents.length === 0) {
      return NextResponse.json({
        data: [],
        total: 0,
        message: "No events found for this user",
      });
    }

    return NextResponse.json(
      {
        data: userEvents,
        total: userEvents.length,
        userId,
        ...(status && { status }),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get user events error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
