import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";

const stripCategoryPrefix = (title: string) => {
  const match = title.match(/^\[(.+?)\]\s*(.+)$/);
  return match ? match[2] : title;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const decoded = await verifyToken(request);
    if (!decoded) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    const { eventId } = await params;

    const event = await prisma.event.findUnique({
      where: { eventID: eventId },
      include: {
        attendees: {
          include: {
            user: {
              select: {
                userId: true,
                email: true,
                name: true,
                username: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      return apiError(404, "Event not found", "NOT_FOUND");
    }

    const attendees = event.attendees.map((row) => ({
      id: row.user.userId,
      email: row.user.email,
      name: row.user.name,
      username: row.user.username,
      role: row.user.role.toLowerCase(),
    }));

    return NextResponse.json(
      {
        eventId: event.eventID,
        eventTitle: stripCategoryPrefix(event.title),
        totalAttendees: attendees.length,
        maxAttendees: attendees.length,
        attendees,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get attendees error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}
