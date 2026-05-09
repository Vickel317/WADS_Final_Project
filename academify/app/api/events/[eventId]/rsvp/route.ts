import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";

const DEFAULT_DURATION_MINUTES = 60;
const DEFAULT_CATEGORY = "General";



export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    // Verify authentication
    const decoded = await verifyToken(request);
    if (!decoded) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    const { eventId  } = await params;
    const event = await prisma.event.findUnique({
      where: { eventID: eventId },
      include: { attendees: { select: { userID: true } } },
    });
    if (!event) {
      return apiError(404, "Event not found", "NOT_FOUND");
    }

    const existing = await prisma.eventAttendee.findUnique({
      where: {
        eventID_userID: { eventID: eventId, userID: decoded.id },
      },
    });

    if (existing) {
      return apiError(400, "You are already attending this event", "BAD_REQUEST");
    }

    await prisma.eventAttendee.create({
      data: {
        eventID: eventId,
        userID: decoded.id,
      },
    });

    const attendeeIds = [...event.attendees.map((attendee) => attendee.userID), decoded.id];

    return NextResponse.json(
      {
        message: "Successfully RSVP'd to event",
        event: {
          id: event.eventID,
          userId: event.creatorID,
          title: event.title,
          description: event.description,
          date: event.dateTime.toISOString(),
          duration: DEFAULT_DURATION_MINUTES,
          location: event.location,
          category: DEFAULT_CATEGORY,
          maxAttendees: attendeeIds.length,
          attendees: attendeeIds,
          status: event.dateTime <= new Date() ? "completed" : "scheduled",
          createdAt: event.createdAt.toISOString(),
          updatedAt: event.createdAt.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("RSVP error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    // Verify authentication
    const decoded = await verifyToken(request);
    if (!decoded) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    const { eventId  } = await params;
    const event = await prisma.event.findUnique({
      where: { eventID: eventId },
      include: { attendees: { select: { userID: true } } },
    });
    if (!event) {
      return apiError(404, "Event not found", "NOT_FOUND");
    }

    const existing = await prisma.eventAttendee.findUnique({
      where: {
        eventID_userID: { eventID: eventId, userID: decoded.id },
      },
    });

    if (!existing) {
      return apiError(400, "You are not attending this event", "BAD_REQUEST");
    }

    await prisma.eventAttendee.delete({
      where: {
        eventID_userID: { eventID: eventId, userID: decoded.id },
      },
    });

    const attendeeIds = event.attendees
      .map((attendee) => attendee.userID)
      .filter((id) => id !== decoded.id);

    return NextResponse.json(
      {
        message: "Successfully cancelled RSVP",
        event: {
          id: event.eventID,
          userId: event.creatorID,
          title: event.title,
          description: event.description,
          date: event.dateTime.toISOString(),
          duration: DEFAULT_DURATION_MINUTES,
          location: event.location,
          category: DEFAULT_CATEGORY,
          maxAttendees: attendeeIds.length,
          attendees: attendeeIds,
          status: event.dateTime <= new Date() ? "completed" : "scheduled",
          createdAt: event.createdAt.toISOString(),
          updatedAt: event.createdAt.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Cancel RSVP error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}




