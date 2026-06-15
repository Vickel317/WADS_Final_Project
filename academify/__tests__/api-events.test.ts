/** @jest-environment node */
import { NextRequest } from "next/server";
import { POST as createEvent } from "@/app/api/events/route";
import { getSessionUser } from "@/lib/auth-session";

jest.mock("@/lib/auth-session", () => ({
  getSessionUser: jest.fn(),
  verifyToken: jest.fn(),
}));

describe("POST /api/events", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    (getSessionUser as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest("http://localhost/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Study group",
        location: "Library",
        date: new Date(Date.now() + 86_400_000).toISOString(),
        forumID: "forum-1",
      }),
    });

    const response = await createEvent(request);
    expect(response.status).toBe(401);
  });
});
