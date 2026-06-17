/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET as listReports } from "@/app/api/reports/route";
import { verifyToken } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/auth-session", () => ({
  verifyToken: jest.fn(),
  getSessionUser: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    reportReview: {
      findMany: jest.fn(),
    },
    forumModerator: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe("GET /api/reports", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 403 for students", async () => {
    (verifyToken as jest.Mock).mockResolvedValue({
      id: "user_student",
      role: "student",
    });
    (prisma.forumModerator.count as jest.Mock).mockResolvedValue(0);

    const request = new NextRequest("http://localhost/api/reports");
    const response = await listReports(request);
    expect(response.status).toBe(403);
    expect(prisma.reportReview.findMany).not.toHaveBeenCalled();
  });

  it("returns 200 for forum moderators", async () => {
    (verifyToken as jest.Mock).mockResolvedValue({
      id: "user_mod",
      role: "student",
    });
    (prisma.forumModerator.count as jest.Mock).mockResolvedValue(1);
    (prisma.forumModerator.findMany as jest.Mock).mockResolvedValue([
      { forumID: "forum_1" },
    ]);
    (prisma.reportReview.findMany as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest("http://localhost/api/reports");
    const response = await listReports(request);
    expect(response.status).toBe(200);
  });

  it("returns 200 for platform admins", async () => {
    (verifyToken as jest.Mock).mockResolvedValue({
      id: "user_admin",
      role: "admin",
    });
    (prisma.reportReview.findMany as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest("http://localhost/api/reports");
    const response = await listReports(request);
    expect(response.status).toBe(200);
  });
});
