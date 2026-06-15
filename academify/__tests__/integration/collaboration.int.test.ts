/** @jest-environment node */
import { NextRequest } from "next/server";
import { POST as createSpace } from "@/app/api/collaboration/route";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-session";

jest.mock("@/lib/auth-session", () => ({
  getSessionUser: jest.fn(),
  verifyToken: jest.fn(),
}));

describe("integration: collaboration API + database", () => {
  const marker = `int-collab-${Date.now()}`;
  let userId: string | null = null;
  let forumId: string | null = null;
  let spaceId: string | null = null;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `${marker}@example.com`,
        password: "better-auth-managed",
        username: `${marker}_user`,
        name: "Collab Integration User",
      },
    });
    userId = user.userId;

    const forum = await prisma.forumHub.create({
      data: {
        name: `${marker}-forum`,
        description: "Collab integration forum",
      },
    });
    forumId = forum.forumID;

    (getSessionUser as jest.Mock).mockResolvedValue({
      session: {},
      user: { userId, email: `${marker}@example.com`, name: "Collab Integration User", role: "STUDENT" },
    });
  });

  afterAll(async () => {
    if (spaceId) {
      await prisma.spaceMember.deleteMany({ where: { spaceID: spaceId } }).catch(() => undefined);
      await prisma.collabSpace.delete({ where: { spaceID: spaceId } }).catch(() => undefined);
    }
    if (forumId) {
      await prisma.forumHub.delete({ where: { forumID: forumId } }).catch(() => undefined);
    }
    if (userId) {
      await prisma.user.delete({ where: { userId } }).catch(() => undefined);
    }
    await prisma.$disconnect();
  });

  it("creates a collaboration space and owner membership in PostgreSQL", async () => {
    const request = new NextRequest("http://localhost/api/collaboration", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: `${marker}-space`,
        description: "Integration collab space",
        forumID: forumId,
      }),
    });

    const response = await createSpace(request);
    expect(response.status).toBe(201);

    const payload = await response.json();
    spaceId = payload.space?.spaceID;
    expect(spaceId).toBeTruthy();

    const member = await prisma.spaceMember.findUnique({
      where: { spaceID_userID: { spaceID: spaceId!, userID: userId! } },
    });
    expect(member?.role).toBe("OWNER");
  });
});
