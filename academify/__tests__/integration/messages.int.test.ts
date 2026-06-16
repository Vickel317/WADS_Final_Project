/** @jest-environment node */
jest.mock("@/lib/auth-session", () => ({
  getSessionUser: jest.fn(),
  verifyToken: jest.fn(),
}));

import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/messages/[userId]/route";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth-session";

describe("integration: messages API + database", () => {
  const marker = `int-messages-${Date.now()}`;
  let senderId: string | null = null;
  let receiverId: string | null = null;
  let messageId: string | null = null;

  beforeAll(async () => {
    const sender = await prisma.user.create({
      data: {
        email: `${marker}-sender@example.com`,
        password: "better-auth-managed",
        username: `${marker}_sender`,
        name: "Message Sender",
      },
    });
    senderId = sender.userId;

    const receiver = await prisma.user.create({
      data: {
        email: `${marker}-receiver@example.com`,
        password: "better-auth-managed",
        username: `${marker}_receiver`,
        name: "Message Receiver",
      },
    });
    receiverId = receiver.userId;

    (getSessionUser as jest.Mock).mockResolvedValue({
      session: {},
      user: { userId: senderId, email: `${marker}-sender@example.com`, name: "Message Sender", role: "STUDENT" },
    });
  });

  afterAll(async () => {
    if (messageId) {
      await prisma.message.delete({ where: { messageID: messageId } }).catch(() => undefined);
    }
    if (receiverId) {
      await prisma.message.deleteMany({ where: { receiverID: receiverId } }).catch(() => undefined);
    }
    if (senderId) {
      await prisma.message.deleteMany({ where: { senderID: senderId } }).catch(() => undefined);
    }
    if (receiverId) {
      await prisma.user.delete({ where: { userId: receiverId } }).catch(() => undefined);
    }
    if (senderId) {
      await prisma.user.delete({ where: { userId: senderId } }).catch(() => undefined);
    }
    await prisma.$disconnect();
  });

  it("sends a DM and persists it in PostgreSQL", async () => {
    const request = new NextRequest(`http://localhost/api/messages/${receiverId}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: `Hello from ${marker}` }),
    });

    const response = await POST(request, { params: Promise.resolve({ userId: receiverId! }) });
    expect(response.status).toBe(201);

    const payload = await response.json();
    expect(payload.data.content).toContain(marker);
    expect(payload.data.senderId).toBe(senderId);
    expect(payload.data.receiverId).toBe(receiverId);
    messageId = payload.data.id;
  });

  it("retrieves the conversation from PostgreSQL", async () => {
    const request = new NextRequest(`http://localhost/api/messages/${receiverId}`);
    const response = await GET(request, { params: Promise.resolve({ userId: receiverId! }) });
    expect(response.status).toBe(200);

    const payload = await response.json();
    const match = payload.messages.find((m: { content: string }) => m.content.includes(marker));
    expect(match).toBeDefined();
    expect(match.senderId).toBe(senderId);
  });

  it("marks unread messages as read", async () => {
    const request = new NextRequest(`http://localhost/api/messages/${senderId}`);
    (getSessionUser as jest.Mock).mockResolvedValue({
      session: {},
      user: { userId: receiverId!, email: `${marker}-receiver@example.com`, name: "Message Receiver", role: "STUDENT" },
    });

    const response = await GET(request, { params: Promise.resolve({ userId: senderId! }) });
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.messages.length).toBeGreaterThan(0);
    expect(payload.messages.every((m: { read: boolean }) => m.read)).toBe(true);
  });
});
