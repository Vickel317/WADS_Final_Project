/** @jest-environment node */
jest.mock("@/lib/auth-session", () => ({
  getSessionUser: jest.fn(),
  verifyToken: jest.fn(),
}));

import { NextRequest } from "next/server";
import { GET } from "@/app/api/admin/users/route";
import { GET as getAnalytics } from "@/app/api/admin/analytics/route";
import { verifyToken } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

describe("integration: admin API + database", () => {
  const marker = `int-admin-${Date.now()}`;
  let adminId: string | null = null;
  let studentId: string | null = null;

  beforeAll(async () => {
    const admin = await prisma.user.create({
      data: {
        email: `${marker}-admin@example.com`,
        password: "better-auth-managed",
        username: `${marker}_admin`,
        name: "Admin Integration User",
        role: "ADMIN",
      },
    });
    adminId = admin.userId;

    const student = await prisma.user.create({
      data: {
        email: `${marker}-student@example.com`,
        password: "better-auth-managed",
        username: `${marker}_student`,
        name: "Admin Integration Student",
      },
    });
    studentId = student.userId;
  });

  afterAll(async () => {
    if (studentId) {
      await prisma.user.delete({ where: { userId: studentId } }).catch(() => undefined);
    }
    if (adminId) {
      await prisma.user.delete({ where: { userId: adminId } }).catch(() => undefined);
    }
    await prisma.$disconnect();
  });

  it("lists users for admin", async () => {
    (verifyToken as jest.Mock).mockResolvedValue({
      id: adminId,
      role: "admin",
    });

    const request = new NextRequest("http://localhost/api/admin/users");
    const response = await GET(request);
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.users.length).toBeGreaterThanOrEqual(1);
    const match = payload.users.find((u: { id: string }) => u.id === studentId);
    expect(match).toBeDefined();
    expect(match.name).toBe("Admin Integration Student");
  });

  it("rejects student from listing users", async () => {
    (verifyToken as jest.Mock).mockResolvedValue({
      id: studentId,
      role: "student",
    });

    const request = new NextRequest("http://localhost/api/admin/users");
    const response = await GET(request);
    expect(response.status).toBe(403);
  });

  it("returns analytics for admin", async () => {
    (verifyToken as jest.Mock).mockResolvedValue({
      id: adminId,
      role: "admin",
    });

    const request = new NextRequest("http://localhost/api/admin/analytics");
    const response = await getAnalytics(request);
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.analytics).toBeDefined();
    expect(payload.analytics.users.total).toBeGreaterThanOrEqual(1);
    expect(payload.analytics.users.byRole).toBeDefined();
  });

  it("rejects student from accessing analytics", async () => {
    (verifyToken as jest.Mock).mockResolvedValue({
      id: studentId,
      role: "student",
    });

    const request = new NextRequest("http://localhost/api/admin/analytics");
    const response = await getAnalytics(request);
    expect(response.status).toBe(403);
  });
});
