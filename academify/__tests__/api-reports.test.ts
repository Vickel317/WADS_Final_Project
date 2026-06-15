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
      count: jest.fn(),
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

    const request = new NextRequest("http://localhost/api/reports");
    const response = await listReports(request);
    expect(response.status).toBe(403);
    expect(prisma.reportReview.findMany).not.toHaveBeenCalled();
  });

  it("returns 200 for moderators", async () => {
    (verifyToken as jest.Mock).mockResolvedValue({
      id: "user_mod",
      role: "moderator",
    });
    (prisma.reportReview.findMany as jest.Mock).mockResolvedValue([]);

    const request = new NextRequest("http://localhost/api/reports");
    const response = await listReports(request);
    expect(response.status).toBe(200);
  });
});
