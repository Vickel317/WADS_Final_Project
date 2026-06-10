/** @jest-environment node */
import { NextRequest } from "next/server";
import { POST as sendMessage } from "@/app/api/messages/[userId]/route";
import { getSessionUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { validateUploadFileName } from "@/lib/validation";

jest.mock("@/lib/auth-session", () => ({
  getSessionUser: jest.fn(),
}));

describe("security-critical guards", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects dangerous upload filenames", () => {
    expect(validateUploadFileName("invoice.pdf.exe").ok).toBe(false);
    expect(validateUploadFileName("logo.svg").ok).toBe(false);
    expect(validateUploadFileName("notes.pdf").ok).toBe(true);
  });

  it("sanitizes message content before persistence", async () => {
    (getSessionUser as jest.Mock).mockResolvedValue({
      user: {
        userId: "test-user-id",
        name: "Test User",
        accountStatus: "ACTIVE",
        role: "STUDENT",
      },
    });

    (prisma.user.findUnique as jest.Mock).mockImplementation(({ where }: { where: { userId: string } }) => {
      if (where.userId === "test-user-id") {
        return Promise.resolve({
          userId: "test-user-id",
          name: "Test User",
          accountStatus: "ACTIVE",
          role: "STUDENT",
        });
      }

      return Promise.resolve({
        userId: where.userId,
        name: "Receiver",
        accountStatus: "ACTIVE",
        role: "STUDENT",
      });
    });

    (prisma.message.create as jest.Mock).mockResolvedValue({
      messageID: "msg_1",
      senderID: "test-user-id",
      receiverID: "receiver-1",
      content: "",
      read: false,
      sentAt: new Date(),
    });

    const request = new NextRequest("http://localhost/api/messages/receiver-1", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: "<script>alert(1)</script> hello" }),
    });

    const response = await sendMessage(request, { params: Promise.resolve({ userId: "receiver-1" }) });

    expect(response.status).toBe(201);
    expect(prisma.message.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          content: "&lt;script&gt;alert(1)&lt;/script&gt; hello",
        }),
      })
    );
  });

  it("blocks restricted users from sending messages", async () => {
    (getSessionUser as jest.Mock).mockResolvedValue({
      user: {
        userId: "test-user-id",
        name: "Test User",
        accountStatus: "BANNED",
        role: "STUDENT",
      },
    });

    (prisma.user.findUnique as jest.Mock).mockImplementation(({ where }: { where: { userId: string } }) => {
      if (where.userId === "test-user-id") {
        return Promise.resolve({
          userId: "test-user-id",
          name: "Test User",
          accountStatus: "BANNED",
          role: "STUDENT",
        });
      }

      return Promise.resolve({
        userId: where.userId,
        name: "Receiver",
        accountStatus: "ACTIVE",
        role: "STUDENT",
      });
    });

    const request = new NextRequest("http://localhost/api/messages/receiver-1", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: "Hello" }),
    });

    const response = await sendMessage(request, { params: Promise.resolve({ userId: "receiver-1" }) });

    expect(response.status).toBe(403);
    expect(prisma.message.create).not.toHaveBeenCalled();
  });
});
