/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET as search } from "@/app/api/search/route";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/get-session", () => ({
  getSession: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    forumModerator: { findMany: jest.fn() },
    user: { findMany: jest.fn() },
    forumHub: { findMany: jest.fn() },
    post: { findMany: jest.fn() },
  },
}));

describe("GET /api/search", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getSession as jest.Mock).mockResolvedValue({
      user: { userId: "me", role: "student" },
    });
    (prisma.forumModerator.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.forumHub.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.post.findMany as jest.Mock).mockResolvedValue([]);
  });

  it("returns 401 when unauthenticated", async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    const response = await search(new NextRequest("http://localhost/api/search?q=test"));
    expect(response.status).toBe(401);
  });

  it("returns empty arrays for blank query", async () => {
    const response = await search(new NextRequest("http://localhost/api/search?q="));
    const body = await response.json();
    expect(body).toEqual({ users: [], forums: [], threads: [] });
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });

  it("returns grouped search results", async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue([
      {
        userId: "u2",
        name: "Alice",
        username: "alice",
        followers: [],
        following: [],
      },
    ]);
    (prisma.forumHub.findMany as jest.Mock).mockResolvedValue([
      { forumID: "f1", name: "Web Dev", description: "WADS discussions" },
    ]);
    (prisma.post.findMany as jest.Mock).mockResolvedValue([
      {
        postID: "p1",
        title: "Study group",
        moderationStatus: "APPROVED",
        authorID: "u2",
        forumID: "f1",
        forum: { name: "Web Dev" },
      },
    ]);

    const response = await search(new NextRequest("http://localhost/api/search?q=web"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.users).toHaveLength(1);
    expect(body.forums).toHaveLength(1);
    expect(body.threads).toHaveLength(1);
    expect(body.forums[0].slug).toBe("web-dev");
  });
});
