import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";
import {
  parseJson,
  parseOptionalDate,
  parseOptionalNumber,
  parseOptionalString,
} from "@/lib/validation";

const DEFAULT_DURATION_MINUTES = 60;
const DEFAULT_CATEGORY = "General";



export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId  } = await params;
    const event = await prisma.event.findUnique({
      where: { eventID: eventId },
      include: { attendees: { select: { userID: true } } },
    });
    if (!event) {
      return apiError(404, "Event not found", "NOT_FOUND");
    }

    const attendeeIds = event.attendees.map((attendee) => attendee.userID);

    return NextResponse.json(
      {
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
      { status: 200 }
    );
  } catch (error) {
    console.error("Get event error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}

export async function PUT(
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

    const existing = await prisma.event.findUnique({
      where: { eventID: eventId },
    });
    if (!existing) {
      return apiError(404, "Event not found", "NOT_FOUND");
    }

    // Check ownership
    if (existing.creatorID !== decoded.id) {
      return apiError(
        403,
        "Forbidden: You can only update your own events",
        "FORBIDDEN"
      );
    }

    const body = await parseJson<{
      title?: unknown;
      description?: unknown;
      date?: unknown;
      duration?: unknown;
      location?: unknown;
      category?: unknown;
      maxAttendees?: unknown;
      status?: unknown;
    }>(request);
    if (!body) {
      return apiError(400, "Invalid JSON", "BAD_REQUEST");
    }

    const errors = [] as Array<{ field?: string; message: string }>;
    const title = parseOptionalString(body.title);
    const description = parseOptionalString(body.description);
    const date = parseOptionalDate(body.date);
    const duration = parseOptionalNumber(body.duration);
    const location = parseOptionalString(body.location);
    const category = parseOptionalString(body.category);
    const maxAttendees = parseOptionalNumber(body.maxAttendees);
    const status = parseOptionalString(body.status);

    if (title.error) errors.push({ field: "title", message: `title ${title.error}` });
    if (description.error) {
      errors.push({ field: "description", message: `description ${description.error}` });
    }
    if (date.error) errors.push({ field: "date", message: `date ${date.error}` });
    if (duration.error) {
      errors.push({ field: "duration", message: `duration ${duration.error}` });
    }
    if (location.error) {
      errors.push({ field: "location", message: `location ${location.error}` });
    }
    if (category.error) {
      errors.push({ field: "category", message: `category ${category.error}` });
    }
    if (maxAttendees.error) {
      errors.push({ field: "maxAttendees", message: `maxAttendees ${maxAttendees.error}` });
    }
    if (status.error) {
      errors.push({ field: "status", message: `status ${status.error}` });
    }

    if (errors.length) {
      return apiError(400, "Invalid request", "BAD_REQUEST", errors);
    }

    if (
      !title.value &&
      description.value === undefined &&
      !date.value &&
      !location.value &&
      !category.value &&
      !maxAttendees.value &&
      !duration.value &&
      !status.value
    ) {
      return apiError(400, "No valid fields to update", "BAD_REQUEST");
    }

    // Update event
    const updatedEvent = await prisma.event.update({
      where: { eventID: eventId },
      data: {
        ...(title.value ? { title: title.value } : {}),
        ...(description.value !== undefined ? { description: description.value } : {}),
        ...(date.value ? { dateTime: date.value } : {}),
        ...(location.value ? { location: location.value } : {}),
      },
      include: { attendees: { select: { userID: true } } },
    });

    const attendeeIds = updatedEvent.attendees.map((attendee) => attendee.userID);

    return NextResponse.json(
      {
        id: updatedEvent.eventID,
        userId: updatedEvent.creatorID,
        title: updatedEvent.title,
        description: updatedEvent.description,
        date: updatedEvent.dateTime.toISOString(),
        duration: duration.value ?? DEFAULT_DURATION_MINUTES,
        location: updatedEvent.location,
        category: category.value || DEFAULT_CATEGORY,
        maxAttendees: maxAttendees.value ?? attendeeIds.length,
        attendees: attendeeIds,
        status: updatedEvent.dateTime <= new Date() ? "completed" : "scheduled",
        createdAt: updatedEvent.createdAt.toISOString(),
        updatedAt: updatedEvent.createdAt.toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update event error:", error);
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

    const existing = await prisma.event.findUnique({
      where: { eventID: eventId },
    });
    if (!existing) {
      return apiError(404, "Event not found", "NOT_FOUND");
    }

    // Check ownership
    if (existing.creatorID !== decoded.id) {
      return apiError(
        403,
        "Forbidden: You can only delete your own events",
        "FORBIDDEN"
      );
    }

    await prisma.event.delete({ where: { eventID: eventId } });

    return NextResponse.json(
      { message: "Event deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete event error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}




