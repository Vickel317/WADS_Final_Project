import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const url = new URL(request.url);
    const type = url.searchParams.get("type");

    const now = new Date();

    let events: Array<{
      eventID: string;
      title: string;
      description: string;
      dateTime: Date;
      location: string;
      forum: { name: string };
      creator: { name: string };
    }> = [];

    if (type === "created") {
      events = await prisma.event.findMany({
        where: { creatorID: userId },
        orderBy: { dateTime: "desc" },
        take: 10,
        select: {
          eventID: true,
          title: true,
          description: true,
          dateTime: true,
          location: true,
          forum: { select: { name: true } },
          creator: { select: { name: true } },
        },
      });
    } else if (type === "attending") {
      events = await prisma.event.findMany({
        where: {
          attendees: { some: { userID: userId } },
          dateTime: { gte: now },
        },
        orderBy: { dateTime: "asc" },
        take: 10,
        select: {
          eventID: true,
          title: true,
          description: true,
          dateTime: true,
          location: true,
          forum: { select: { name: true } },
          creator: { select: { name: true } },
        },
      });
    } else {
      events = await prisma.event.findMany({
        where: {
          OR: [
            { creatorID: userId },
            { attendees: { some: { userID: userId } } },
          ],
        },
        orderBy: { dateTime: "desc" },
        take: 10,
        select: {
          eventID: true,
          title: true,
          description: true,
          dateTime: true,
          location: true,
          forum: { select: { name: true } },
          creator: { select: { name: true } },
        },
      });
    }

    return NextResponse.json({
      data: events.map((e) => ({
        id: e.eventID,
        title: e.title,
        description: e.description.slice(0, 200),
        date: e.dateTime.toISOString(),
        location: e.location,
        forum: e.forum.name,
        creator: e.creator.name,
        isUpcoming: new Date(e.dateTime) >= now,
      })),
      total: events.length,
      userId,
    });
  } catch (error) {
    console.error("Get user events error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
