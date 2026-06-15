/** @jest-environment node */
jest.mock("@/lib/auth-session", () => ({
  getSessionUser: jest.fn(),
  verifyToken: jest.fn(),
}));

import { GET } from "@/app/api/events/route";
import { prisma } from "@/lib/prisma";

describe("integration: events API + database", () => {
  const marker = `int-events-${Date.now()}`;
  let userId: string | null = null;
  let forumId: string | null = null;
  let eventId: string | null = null;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `${marker}@example.com`,
        password: "better-auth-managed",
        username: `${marker}_user`,
        name: "Event Integration User",
      },
    });
    userId = user.userId;

    const forum = await prisma.forumHub.create({
      data: {
        name: `${marker}-forum`,
        description: "Events integration forum",
      },
    });
    forumId = forum.forumID;

    const event = await prisma.event.create({
      data: {
        creatorID: userId,
        forumID: forumId,
        title: `[Workshop] ${marker}`,
        description: "Integration event",
        dateTime: new Date(Date.now() + 7 * 86_400_000),
        location: "Room 101",
      },
    });
    eventId = event.eventID;
  });

  afterAll(async () => {
    if (eventId) {
      await prisma.eventAttendee.deleteMany({ where: { eventID: eventId } }).catch(() => undefined);
      await prisma.event.delete({ where: { eventID: eventId } }).catch(() => undefined);
    }
    if (forumId) {
      await prisma.forumHub.delete({ where: { forumID: forumId } }).catch(() => undefined);
    }
    if (userId) {
      await prisma.user.delete({ where: { userId } }).catch(() => undefined);
    }
    await prisma.$disconnect();
  });

  it("lists upcoming events persisted in PostgreSQL", async () => {
    const request = new Request("http://localhost/api/events?filter=upcoming");
    const response = await GET(request);
    expect(response.status).toBe(200);

    const payload = await response.json();
    const match = (payload.data ?? []).find((event: { id: string }) => event.id === eventId);
    expect(match).toBeDefined();
    expect(match.title).toContain(marker);
    expect(match.category).toBe("Workshop");
  });
});
