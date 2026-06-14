/** @jest-environment node */
import { NextRequest } from "next/server";
import { POST as createCategory } from "@/app/api/categories/route";
import { getSessionUser } from "@/lib/auth-session";

jest.mock("@/lib/auth-session", () => ({
  getSessionUser: jest.fn(),
  normalizeRole: (role: string) => role.toLowerCase(),
}));

describe("POST /api/categories authorization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 403 for students", async () => {
    (getSessionUser as jest.Mock).mockResolvedValue({
      user: { userId: "u1", role: "student" },
    });

    const request = new NextRequest("http://localhost/api/categories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Computer Science",
        description: "Course forum",
        slug: "computer-science",
      }),
    });

    const response = await createCategory(request);
    expect(response.status).toBe(403);
  });
});
