import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-session";
import { apiError } from "@/lib/api-response";
import {
  parseJson,
  parseOptionalNumber,
  parseOptionalString,
  parseRequiredDate,
  parseRequiredString,
} from "@/lib/validation";

const DEFAULT_DURATION_MINUTES = 60;
const DEFAULT_CATEGORY = "Study Session";
const DEFAULT_FORUM_NAME = "General";

const resolveForum = async (value?: string | null) => {
  if (value) {
    const existing = await prisma.forumHub.findFirst({
      where: {
        OR: [
          { forumID: value },
          { name: { equals: value, mode: "insensitive" } },
        ],
      },
    });
    if (existing) return existing;
  }

  const first = await prisma.forumHub.findFirst({ orderBy: { createdAt: "asc" } });
  if (first) return first;

  return prisma.forumHub.create({
    data: {
      name: DEFAULT_FORUM_NAME,
      description: "Default forum",
    },
  });
};

const parseCategoryFromTitle = (titleValue: string) => {
  const match = titleValue.match(/^\[(.+?)\]\s*(.+)$/);
  if (!match) {
    return { category: DEFAULT_CATEGORY, title: titleValue };
  }
  return { category: match[1], title: match[2] };
};

const formatTitleWithCategory = (categoryValue: string, titleValue: string) => {
  if (!categoryValue || categoryValue === DEFAULT_CATEGORY) return titleValue;
  return `[${categoryValue}] ${titleValue}`;
};

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const filter = url.searchParams.get("filter");
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = 10;

    const now = new Date();
    const where =
      filter === "upcoming"
        ? { dateTime: { gt: now } }
        : filter === "past"
          ? { dateTime: { lte: now } }
          : {};
    const [total, events] = await Promise.all([
      prisma.event.count({ where }),
      prisma.event.findMany({
        where,
        orderBy: { dateTime: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          attendees: { select: { userID: true } },
          creator: { select: { userId: true, name: true, username: true } },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json(
      {
        data: events.map((event) => {
          const attendeeIds = event.attendees.map((attendee) => attendee.userID);
          const parsed = parseCategoryFromTitle(event.title);
          return {
            id: event.eventID,
            userId: event.creatorID,
            creator: {
              id: event.creator.userId,
              name: event.creator.name,
              username: event.creator.username,
            },
            title: parsed.title,
            description: event.description,
            date: event.dateTime.toISOString(),
            duration: DEFAULT_DURATION_MINUTES,
            location: event.location,
            category: parsed.category,
            maxAttendees: 0,
            attendees: attendeeIds,
            status: event.dateTime <= now ? "completed" : "scheduled",
            createdAt: event.createdAt.toISOString(),
            updatedAt: event.createdAt.toISOString(),
          };
        }),
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
    console.error("Get events error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request.headers);
    if (!sessionUser) {
      return apiError(401, "Not authenticated", "UNAUTHORIZED");
    }

    const body = await parseJson<{
      title?: unknown;
      description?: unknown;
      date?: unknown;
      duration?: unknown;
      location?: unknown;
      category?: unknown;
      forumId?: unknown;
      forum?: unknown;
      maxAttendees?: unknown;
    }>(request);
    if (!body) {
      return apiError(400, "Invalid JSON", "BAD_REQUEST");
    }

    const errors = [] as Array<{ field?: string; message: string }>;
    const title = parseRequiredString(body.title);
    const location = parseRequiredString(body.location);
    const date = parseRequiredDate(body.date);
    const description = parseOptionalString(body.description);
    const category = parseOptionalString(body.category);
    const duration = parseOptionalNumber(body.duration);
    const maxAttendees = parseOptionalNumber(body.maxAttendees);
    const forumId = parseOptionalString(body.forumId ?? body.forum);

    if (title.error) errors.push({ field: "title", message: `title ${title.error}` });
    if (location.error) {
      errors.push({ field: "location", message: `location ${location.error}` });
    }
    if (date.error) errors.push({ field: "date", message: `date ${date.error}` });
    if (description.error) {
      errors.push({ field: "description", message: `description ${description.error}` });
    }
    if (category.error) {
      errors.push({ field: "category", message: `category ${category.error}` });
    }
    if (duration.error) {
      errors.push({ field: "duration", message: `duration ${duration.error}` });
    }
    if (maxAttendees.error) {
      errors.push({ field: "maxAttendees", message: `maxAttendees ${maxAttendees.error}` });
    }
    if (forumId.error) {
      errors.push({ field: "forumId", message: `forumId ${forumId.error}` });
    }

    if (errors.length) {
      return apiError(400, "Invalid request", "BAD_REQUEST", errors);
    }

    const forum = await resolveForum(forumId.value ?? null);

    const createdEvent = await prisma.event.create({
      data: {
        creator: { connect: { userId: sessionUser.user.userId } },
        forum: { connect: { forumID: forum.forumID } },
        title: formatTitleWithCategory(
          category.value || DEFAULT_CATEGORY,
          title.value!
        ),
        description: description.value || "",
        dateTime: date.value!,
        location: location.value!,
      },
      include: { creator: { select: { userId: true, name: true, username: true } } },
    });

    const parsed = parseCategoryFromTitle(createdEvent.title);

    await prisma.eventAttendee.create({
      data: {
        eventID: createdEvent.eventID,
        userID: sessionUser.user.userId,
      },
    });

    return NextResponse.json(
      {
        id: createdEvent.eventID,
        userId: createdEvent.creatorID,
        creator: {
          id: createdEvent.creator.userId,
          name: createdEvent.creator.name,
          username: createdEvent.creator.username,
        },
        title: parsed.title,
        description: createdEvent.description,
        date: createdEvent.dateTime.toISOString(),
        duration: duration.value ?? DEFAULT_DURATION_MINUTES,
        location: createdEvent.location,
        category: parsed.category,
        maxAttendees: maxAttendees.value ?? 0,
        attendees: [sessionUser.user.userId],
        status: createdEvent.dateTime <= new Date() ? "completed" : "scheduled",
        createdAt: createdEvent.createdAt.toISOString(),
        updatedAt: createdEvent.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create event error:", error);
    return apiError(500, "Internal server error", "INTERNAL_ERROR");
  }
}
