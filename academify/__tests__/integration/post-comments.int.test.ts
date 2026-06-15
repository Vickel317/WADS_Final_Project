/** @jest-environment node */
import { NextRequest } from "next/server";
import { POST as createComment } from "@/app/api/posts/[postId]/comments/route";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth-session";
import { ModerationStatus } from "@prisma/client";

jest.mock("@/lib/auth-session", () => ({
  verifyToken: jest.fn(),
  getSessionUser: jest.fn(),
}));

describe("integration: post comments API + database", () => {
  const marker = `int-post-${Date.now()}`;
  let userId: string | null = null;
  let forumId: string | null = null;
  let postId: string | null = null;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `${marker}@example.com`,
        password: "better-auth-managed",
        username: `${marker}_user`,
        name: "Integration User",
      },
    });
    userId = user.userId;

    const forum = await prisma.forumHub.create({
      data: {
        name: `${marker}-forum`,
        description: "Integration forum",
      },
    });
    forumId = forum.forumID;

    const post = await prisma.post.create({
      data: {
        title: "Integration post",
        content: "Hello integration",
        authorID: userId,
        forumID: forumId,
        moderationStatus: ModerationStatus.APPROVED,
      },
    });
    postId = post.postID;

    (verifyToken as jest.Mock).mockResolvedValue({
      id: userId,
      role: "student",
    });
  });

  afterAll(async () => {
    if (postId) {
      await prisma.comment.deleteMany({ where: { postID: postId } }).catch(() => undefined);
      await prisma.post.delete({ where: { postID: postId } }).catch(() => undefined);
    }
    if (forumId) {
      await prisma.forumHub.delete({ where: { forumID: forumId } }).catch(() => undefined);
    }
    if (userId) {
      await prisma.user.delete({ where: { userId } }).catch(() => undefined);
    }
    await prisma.$disconnect();
  });

  it("stores sanitized comment content in PostgreSQL", async () => {
    const request = new NextRequest(`http://localhost/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: "<script>alert(1)</script> safe text" }),
    });

    const response = await createComment(request, {
      params: Promise.resolve({ postId: postId! }),
    });
    expect(response.status).toBe(201);

    const saved = await prisma.comment.findFirst({
      where: { postID: postId!, authorID: userId! },
      orderBy: { createdAt: "desc" },
    });
    expect(saved).toBeTruthy();
    expect(saved?.content).not.toContain("<script>");
    expect(saved?.content).toContain("safe text");
  });
});
