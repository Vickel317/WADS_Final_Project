/** @jest-environment node */
jest.mock("@/lib/auth-session", () => ({
  getSessionUser: jest.fn(),
  verifyToken: jest.fn(),
}));

import { GET } from "@/app/api/categories/route";
import { prisma } from "@/lib/prisma";

describe("integration: categories API + database", () => {
  const marker = `int-categories-${Date.now()}`;
  let forumId: string | null = null;

  afterAll(async () => {
    if (forumId) {
      await prisma.forumHub.delete({ where: { forumID: forumId } }).catch(() => undefined);
    }
    await prisma.$disconnect();
  });

  it("lists forums persisted in PostgreSQL", async () => {
    const created = await prisma.forumHub.create({
      data: {
        name: marker,
        description: "Integration test forum",
      },
    });
    forumId = created.forumID;

    const response = await GET();
    expect(response.status).toBe(200);

    const payload = await response.json();
    const match = (payload.categories ?? []).find(
      (category: { id: string }) => category.id === forumId
    );
    expect(match).toBeDefined();
    expect(match.name).toBe(marker);
  });
});
