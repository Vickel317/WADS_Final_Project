/** @jest-environment node */
jest.mock("@/lib/auth-session", () => ({
  getSessionUser: jest.fn(),
  verifyToken: jest.fn(),
}));

import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/reports/route";
import { PUT as reviewReport } from "@/app/api/reports/[reportId]/review/route";
import { verifyToken } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

describe("integration: reports API + database", () => {
  const marker = `int-reports-${Date.now()}`;
  let reporterId: string | null = null;
  let moderatorId: string | null = null;
  let postId: string | null = null;
  let reportId: string | null = null;

  beforeAll(async () => {
    const reporter = await prisma.user.create({
      data: {
        email: `${marker}-reporter@example.com`,
        password: "better-auth-managed",
        username: `${marker}_reporter`,
        name: "Report Integration Reporter",
      },
    });
    reporterId = reporter.userId;

    const moderator = await prisma.user.create({
      data: {
        email: `${marker}-mod@example.com`,
        password: "better-auth-managed",
        username: `${marker}_mod`,
        name: "Report Integration Mod",
      },
    });
    moderatorId = moderator.userId;

    const forum = await prisma.forumHub.create({
      data: { name: `${marker}-forum`, description: "Reports integration forum" },
    });

    const post = await prisma.post.create({
      data: {
        authorID: reporterId,
        forumID: forum.forumID,
        title: `[Report Target] ${marker}`,
        content: "Post to be reported",
        moderationStatus: "APPROVED",
      },
    });
    postId = post.postID;

    (verifyToken as jest.Mock).mockResolvedValue({
      id: reporterId,
      role: "student",
    });
  });

  afterAll(async () => {
    if (reportId) {
      await prisma.reportReview.delete({ where: { reportreviewID: reportId } }).catch(() => undefined);
    }
    if (postId) {
      await prisma.post.delete({ where: { postID: postId } }).catch(() => undefined);
    }
    if (moderatorId) {
      await prisma.user.delete({ where: { userId: moderatorId } }).catch(() => undefined);
    }
    if (reporterId) {
      await prisma.user.delete({ where: { userId: reporterId } }).catch(() => undefined);
    }
    await prisma.$disconnect();
  });

  it("submits a report and persists it in PostgreSQL", async () => {
    const request = new NextRequest("http://localhost/api/reports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        targetType: "post",
        targetId: postId,
        reason: `Spam content ${marker}`,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);

    const payload = await response.json();
    expect(payload.report.targetType).toBe("post");
    expect(payload.report.targetId).toBe(postId);
    expect(payload.report.status).toBe("pending");
    reportId = payload.report.id;
  });

  it("lists reports for moderator", async () => {
    (verifyToken as jest.Mock).mockResolvedValue({
      id: moderatorId,
      role: "moderator",
    });

    const request = new NextRequest("http://localhost/api/reports");
    const response = await GET(request);
    expect(response.status).toBe(200);

    const payload = await response.json();
    const match = payload.reports.find((r: { id: string }) => r.id === reportId);
    expect(match).toBeDefined();
    expect(match.reason).toContain(marker);
  });

  it("rejects student from listing reports", async () => {
    (verifyToken as jest.Mock).mockResolvedValue({
      id: reporterId,
      role: "student",
    });

    const request = new NextRequest("http://localhost/api/reports");
    const response = await GET(request);
    expect(response.status).toBe(403);
  });

  it("marks a report as reviewed", async () => {
    (verifyToken as jest.Mock).mockResolvedValue({
      id: moderatorId,
      role: "moderator",
    });

    const request = new NextRequest(`http://localhost/api/reports/${reportId}/review`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reviewNote: "Reviewed by mod" }),
    });

    const response = await reviewReport(request, { params: Promise.resolve({ reportId: reportId! }) });
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.report.status).toBe("reviewed");
    expect(payload.report.reviewNote).toBe("Reviewed by mod");
  });
});
