/** @jest-environment node */
import { NextRequest } from "next/server";
import { POST as approvePost } from "@/app/api/moderation/approve/[postId]/route";
import { POST as banUser } from "@/app/api/moderation/ban/[userId]/route";
import { verifyToken } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { ModerationStatus, UserStatus } from "@prisma/client";

jest.mock("@/lib/auth-session", () => ({
  verifyToken: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    post: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    forumModerator: {
      findUnique: jest.fn(),
    },
    moderationActionLog: {
      create: jest.fn().mockResolvedValue({}),
    },
  },
}));

jest.mock("@/lib/moderation-log-store", () => ({
  appendModerationLog: jest.fn(),
}));

describe("forum moderator moderation actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("allows forum moderators to approve posts in their forum", async () => {
    (verifyToken as jest.Mock).mockResolvedValue({
      id: "mod_user",
      role: "student",
    });
    (prisma.post.findUnique as jest.Mock).mockResolvedValue({
      postID: "post_1",
      forumID: "forum_1",
    });
    (prisma.forumModerator.findUnique as jest.Mock).mockResolvedValue({
      forumID: "forum_1",
      userID: "mod_user",
    });
    (prisma.post.update as jest.Mock).mockResolvedValue({
      postID: "post_1",
      title: "Test",
      moderationStatus: ModerationStatus.APPROVED,
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const request = new NextRequest("http://localhost/api/moderation/approve/post_1", {
      method: "POST",
    });
    const response = await approvePost(request, { params: Promise.resolve({ postId: "post_1" }) });

    expect(response.status).toBe(200);
    expect(prisma.post.update).toHaveBeenCalled();
  });

  it("persists account bans to the database", async () => {
    (verifyToken as jest.Mock).mockResolvedValue({
      id: "admin_user",
      role: "admin",
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      userId: "target_user",
      accountStatus: UserStatus.ACTIVE,
    });
    (prisma.user.update as jest.Mock).mockResolvedValue({
      userId: "target_user",
      accountStatus: UserStatus.BANNED,
    });

    const request = new NextRequest("http://localhost/api/moderation/ban/target_user", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason: "Policy violation" }),
    });
    const response = await banUser(request, { params: Promise.resolve({ userId: "target_user" }) });

    expect(response.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { userId: "target_user" },
      data: { accountStatus: UserStatus.BANNED },
      select: { userId: true, accountStatus: true },
    });
  });
});
