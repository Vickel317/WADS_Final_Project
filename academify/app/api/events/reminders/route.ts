import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-session";
import { emitNotificationToUser } from "@/lib/notify";

const REMINDER_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function GET(request: NextRequest) {
  const sessionUser = await getSessionUser(request.headers);
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_MS);

    const upcomingEvents = await prisma.event.findMany({
      where: {
        dateTime: { gte: now, lte: windowEnd },
      },
      include: {
        attendees: { select: { userID: true } },
      },
    });

    if (upcomingEvents.length === 0) {
      return NextResponse.json({ reminded: 0 });
    }

    let reminded = 0;

    for (const event of upcomingEvents) {
      // Check if a reminder was already sent for this event (within the last 30 minutes)
      const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);
      const existingReminder = await prisma.notification.findFirst({
        where: {
          type: "event_reminder",
          link: `/events/${event.eventID}`,
          createdAt: { gte: thirtyMinAgo },
        },
      });

      if (existingReminder) continue;

      const timeUntil = Math.round((event.dateTime.getTime() - now.getTime()) / 60000);
      const timeLabel = timeUntil <= 60 ? `in ${timeUntil} minutes` : `in ${Math.round(timeUntil / 60)} hours`;

      const attendeeIds = event.attendees.map((a) => a.userID);

      if (attendeeIds.length === 0) continue;

      const notifications = await prisma.notification.createManyAndReturn({
        data: attendeeIds.map((userID) => ({
          userID,
          type: "event_reminder",
          content: `Reminder: "${event.title}" starts ${timeLabel} at ${event.location}`,
          link: `/events/${event.eventID}`,
        })),
      });

      for (const n of notifications) {
        emitNotificationToUser(n.userID, {
          notificationID: n.notificationID,
          content: n.content,
          link: n.link,
          createdAt: n.createdAt.toISOString(),
        });
        reminded++;
      }
    }

    return NextResponse.json({ reminded });
  } catch (error) {
    console.error("Event reminders error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
