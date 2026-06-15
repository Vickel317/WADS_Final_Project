/** @jest-environment node */
import { prisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/sanitization";
import { canViewPost } from "@/lib/post-visibility";
import { ModerationStatus } from "@prisma/client";

describe("integration: post visibility + database", () => {
  const marker = `int-visibility-${Date.now()}`;
  let authorId: string | null = null;
  let otherUserId: string | null = null;
  let forumId: string | null = null;
  let pendingPostId: string | null = null;

  beforeAll(async () => {
    const author = await prisma.user.create({
      data: {
        email: `${marker}-author@example.com`,
        password: "better-auth-managed",
        username: `${marker}_author`,
        name: "Author",
      },
    });
    authorId = author.userId;

    const other = await prisma.user.create({
      data: {
        email: `${marker}-other@example.com`,
        password: "better-auth-managed",
        username: `${marker}_other`,
        name: "Other",
      },
    });
    otherUserId = other.userId;

    const forum = await prisma.forumHub.create({
      data: { name: `${marker}-forum`, description: "visibility test" },
    });
    forumId = forum.forumID;

    const post = await prisma.post.create({
      data: {
        title: "Pending post",
        content: sanitizeText("pending content"),
        authorID: authorId,
        forumID: forumId,
        moderationStatus: ModerationStatus.PENDING,
      },
    });
    pendingPostId = post.postID;
  });

  afterAll(async () => {
    if (pendingPostId) {
      await prisma.post.delete({ where: { postID: pendingPostId } }).catch(() => undefined);
    }
    if (forumId) {
      await prisma.forumHub.delete({ where: { forumID: forumId } }).catch(() => undefined);
    }
    if (authorId) {
      await prisma.user.delete({ where: { userId: authorId } }).catch(() => undefined);
    }
    if (otherUserId) {
      await prisma.user.delete({ where: { userId: otherUserId } }).catch(() => undefined);
    }
    await prisma.$disconnect();
  });

  it("allows authors to view their pending posts", () => {
    expect(
      canViewPost(
        { moderationStatus: ModerationStatus.PENDING, authorID: authorId!, forumID: forumId! },
        { id: authorId!, role: "student" }
      )
    ).toBe(true);
  });

  it("blocks other students from viewing pending posts", () => {
    expect(
      canViewPost(
        { moderationStatus: ModerationStatus.PENDING, authorID: authorId!, forumID: forumId! },
        { id: otherUserId!, role: "student" }
      )
    ).toBe(false);
  });
});
