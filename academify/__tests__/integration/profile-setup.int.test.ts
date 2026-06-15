/** @jest-environment node */
import { NextRequest } from "next/server";
import { POST as completeSetup } from "@/app/api/profile/setup/route";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";

jest.mock("@/lib/get-session", () => ({
  getSession: jest.fn(),
}));

describe("integration: profile setup API + database", () => {
  const marker = `int-setup-${Date.now()}`;
  let userId: string | null = null;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `${marker}@example.com`,
        password: "better-auth-managed",
        username: `${marker}_user`,
        name: "Setup Integration User",
        profileSetupComplete: false,
      },
    });
    userId = user.userId;

    (getSession as jest.Mock).mockResolvedValue({
      provider: "better-auth",
      session: {},
      user: {
        userId,
        email: `${marker}@example.com`,
        username: `${marker}_user`,
        name: "Setup Integration User",
        role: "STUDENT",
      },
    });
  });

  afterAll(async () => {
    if (userId) {
      await prisma.user.delete({ where: { userId } }).catch(() => undefined);
    }
    await prisma.$disconnect();
  });

  it("marks setup complete and stores normalized education level", async () => {
    const request = new NextRequest("http://localhost/api/profile/setup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        role: "STUDENT",
        bio: "Integration bio",
        educationLevel: "Grade 8",
        skillTags: ["Math", "Reading"],
        portfolioLinks: ["https://example.com"],
      }),
    });

    const response = await completeSetup(request);
    expect(response.status).toBe(200);

    const updated = await prisma.user.findUnique({ where: { userId: userId! } });
    expect(updated?.profileSetupComplete).toBe(true);
    expect(updated?.academicLevel).toBe("Grade 8");
    expect(updated?.skillTags).toEqual(["Math", "Reading"]);
    expect(updated?.bio).toBe("Integration bio");
  });
});
