/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET as adminAnalyticsGet } from "@/app/api/admin/analytics/route";
import { GET as moderationLogsGet } from "@/app/api/moderation/logs/route";
import { PUT as postUpdate, DELETE as postDelete } from "@/app/api/posts/[postId]/route";
import { DELETE as fileDelete } from "@/app/api/files/[fileId]/route";
import { verifyToken } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/auth-session", () => ({
  verifyToken: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    post: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    comment: {
      count: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    file: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    reportReview: {
      findMany: jest.fn(),
    },
    moderationActionLog: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    moderationLog: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
  },
}));

describe("Authorization checks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 403 for students on admin endpoints", async () => {
    (verifyToken as jest.Mock).mockResolvedValue({
      id: "user_student",
      email: "student@example.com",
      role: "student",
    });
    (prisma.post.count as jest.Mock).mockResolvedValue(0);
    (prisma.comment.count as jest.Mock).mockResolvedValue(0);

    const request = new NextRequest("http://localhost/api/admin/analytics");
    const response = await adminAnalyticsGet(request);

    expect(response.status).toBe(403);
  });

  it("falls back to empty analytics when the database is unavailable", async () => {
    (verifyToken as jest.Mock).mockResolvedValue({
      id: "user_admin",
      email: "admin@example.com",
      role: "admin",
    });
    (prisma.post.count as jest.Mock).mockRejectedValue({ code: "ECONNREFUSED" });
    (prisma.comment.count as jest.Mock).mockResolvedValue(0);
    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.reportReview.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.moderationActionLog.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.post.findMany as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest("http://localhost/api/admin/analytics");
    const response = await adminAnalyticsGet(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.warning).toBe("Database unavailable; showing empty analytics.");
    expect(body.analytics.users.total).toBe(0);
    expect(body.analytics.posts.total).toBe(0);
  });

  it("allows moderators on moderation endpoints", async () => {
    (verifyToken as jest.Mock).mockResolvedValue({
      id: "user_mod",
      email: "mod@example.com",
      role: "moderator",
    });

    const request = new NextRequest("http://localhost/api/moderation/logs");
    const response = await moderationLogsGet(request);

    expect(response.status).toBe(200);
  });

  it("returns 403 when non-owners update posts", async () => {
    (verifyToken as jest.Mock).mockResolvedValue({
      id: "user_other",
      email: "other@example.com",
      role: "student",
    });
    (prisma.post.findUnique as jest.Mock).mockResolvedValue({
      postID: "post_1",
      authorID: "user_owner",
    });

    const request = new NextRequest("http://localhost/api/posts/post_1", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Updated", content: "Updated content" }),
    });

    const response = await postUpdate(request, { params: Promise.resolve({ postId: "post_1" }) });

    expect(response.status).toBe(403);
  });

  it("returns 403 when non-owners delete posts", async () => {
    (verifyToken as jest.Mock).mockResolvedValue({
      id: "user_other",
      email: "other@example.com",
      role: "student",
    });
    (prisma.post.findUnique as jest.Mock).mockResolvedValue({
      postID: "post_2",
      authorID: "user_owner",
    });

    const request = new NextRequest("http://localhost/api/posts/post_2", {
      method: "DELETE",
    });

    const response = await postDelete(request, { params: Promise.resolve({ postId: "post_2" }) });

    expect(response.status).toBe(403);
  });

  it("returns 403 when non-owners delete files", async () => {
    (verifyToken as jest.Mock).mockResolvedValue({
      id: "user_other",
      email: "other@example.com",
      role: "student",
    });
    (prisma.file.findUnique as jest.Mock).mockResolvedValue({
      fileID: "1",
      uploadedByID: "user_owner",
      fileUrl: "some/path",
    });

    const request = new NextRequest("http://localhost/api/files/1", {
      method: "DELETE",
    });

    const response = await fileDelete(request, { params: Promise.resolve({ fileId: "1" }) });

    expect(response.status).toBe(403);
  });
});
