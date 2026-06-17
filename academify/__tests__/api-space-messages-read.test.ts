/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET as getSpaceMessages } from "@/app/api/messages/space/[spaceId]/route";
import { getSessionUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/auth-session", () => ({
  getSessionUser: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    collabSpace: { findUnique: jest.fn() },
    spaceMember: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    message: {
      updateMany: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe("GET /api/messages/space/[spaceId] read receipts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getSessionUser as jest.Mock).mockResolvedValue({
      user: { userId: "user_b", role: "STUDENT" },
    });
    (prisma.collabSpace.findUnique as jest.Mock).mockResolvedValue({ spaceID: "space_1" });
    (prisma.spaceMember.upsert as jest.Mock).mockResolvedValue({});
    (prisma.spaceMember.findMany as jest.Mock).mockResolvedValue([
      { userID: "user_a" },
      { userID: "user_b" },
    ]);
    (prisma.message.updateMany as jest.Mock).mockResolvedValue({ count: 2 });
    (prisma.message.findMany as jest.Mock).mockResolvedValue([]);
  });

  it("marks space messages read even when polling with since", async () => {
    const since = new Date("2026-06-17T10:00:00.000Z").toISOString();
    const request = new NextRequest(
      `http://localhost/api/messages/space/space_1?since=${encodeURIComponent(since)}`
    );

    const response = await getSpaceMessages(request, {
      params: Promise.resolve({ spaceId: "space_1" }),
    });

    expect(response.status).toBe(200);
    expect(prisma.message.updateMany).toHaveBeenCalledWith({
      where: {
        spaceID: "space_1",
        receiverID: "user_b",
        read: false,
      },
      data: { read: true },
    });
  });
});
