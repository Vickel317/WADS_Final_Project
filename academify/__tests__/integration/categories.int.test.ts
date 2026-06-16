/** @jest-environment node */
jest.mock("@/lib/auth-session", () => ({
  getSessionUser: jest.fn(),
  verifyToken: jest.fn(),
}));

import { NextRequest } from "next/server";
import { GET } from "@/app/api/categories/route";
import { DELETE } from "@/app/api/categories/[id]/route";
import { verifyToken } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

describe("integration: categories API + database", () => {
  const marker = `int-categories-${Date.now()}`;
  let forumId: string | null = null;
  let adminId: string | null = null;

  afterAll(async () => {
    if (forumId) {
      await prisma.forumHub.delete({ where: { forumID: forumId } }).catch(() => undefined);
    }
    if (adminId) {
      await prisma.user.delete({ where: { userId: adminId } }).catch(() => undefined);
    }
    await prisma.$disconnect();
  });

  it("lists forums persisted in PostgreSQL", async () => {
    const created = await prisma.forumHub.create({
      data: {
        name: marker,
        description: "Integration test forum",
      },
    });
    forumId = created.forumID;

    const response = await GET();
    expect(response.status).toBe(200);

    const payload = await response.json();
    const match = (payload.categories ?? []).find(
      (category: { id: string }) => category.id === forumId
    );
    expect(match).toBeDefined();
    expect(match.name).toBe(marker);
  });

  it("deletes a forum that still has posts (admin cascade)", async () => {
    const admin = await prisma.user.create({
      data: {
        email: `${marker}-admin@example.com`,
        password: "better-auth-managed",
        username: `${marker}_admin`,
        name: "Categories Integration Admin",
        role: "ADMIN",
      },
    });
    adminId = admin.userId;

    const forum = await prisma.forumHub.create({
      data: {
        name: `${marker}-delete`,
        description: "Forum with posts to delete",
      },
    });
    forumId = forum.forumID;

    await prisma.post.create({
      data: {
        authorID: adminId,
        forumID: forumId,
        title: `[Delete Test] ${marker}`,
        content: "Post blocking forum delete",
        moderationStatus: "APPROVED",
      },
    });

    (verifyToken as jest.Mock).mockResolvedValue({
      id: adminId,
      role: "admin",
    });

    const response = await DELETE(
      new NextRequest(`http://localhost/api/categories/${forumId}`, { method: "DELETE" }),
      { params: Promise.resolve({ id: forumId }) }
    );

    expect(response.status).toBe(200);
    forumId = null;

    const remaining = await prisma.forumHub.findUnique({ where: { forumID: forum.forumID } });
    expect(remaining).toBeNull();
  });
});
