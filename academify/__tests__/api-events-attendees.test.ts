/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET as getAttendees } from "@/app/api/events/[eventId]/attendees/route";
import { verifyToken } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/auth-session", () => ({
  verifyToken: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    event: {
      findUnique: jest.fn(),
    },
  },
}));

describe("GET /api/events/[eventId]/attendees", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    (verifyToken as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest("http://localhost/api/events/event_1/attendees");
    const response = await getAttendees(request, {
      params: Promise.resolve({ eventId: "event_1" }),
    });

    expect(response.status).toBe(401);
  });

  it("returns attendee details from the database", async () => {
    (verifyToken as jest.Mock).mockResolvedValue({
      id: "user_1",
      role: "student",
    });
    (prisma.event.findUnique as jest.Mock).mockResolvedValue({
      eventID: "event_1",
      title: "[Study Session] JavaScript Workshop",
      attendees: [
        {
          user: {
            userId: "user_1",
            email: "john@example.com",
            name: "John Doe",
            username: "john",
            role: "STUDENT",
          },
        },
      ],
    });

    const request = new NextRequest("http://localhost/api/events/event_1/attendees");
    const response = await getAttendees(request, {
      params: Promise.resolve({ eventId: "event_1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.eventTitle).toBe("JavaScript Workshop");
    expect(body.attendees).toHaveLength(1);
    expect(body.attendees[0]).toMatchObject({
      id: "user_1",
      name: "John Doe",
      role: "student",
    });
  });
});
