/** @jest-environment node */
import { NextRequest } from "next/server";
import { POST as sendMessage } from "@/app/api/messages/[userId]/route";
import { POST as createPost } from "@/app/api/posts/route";
import { POST as createComment } from "@/app/api/posts/[postId]/comments/route";
import { getSessionUser, verifyToken } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { validateUploadFileName } from "@/lib/validation";

jest.mock("@/lib/auth-session", () => ({
  getSessionUser: jest.fn(),
  verifyToken: jest.fn(),
}));

jest.mock("@/lib/ai/post-moderation", () => ({
  applyPostModeration: jest.fn(),
}));

jest.mock("next/server", () => {
  const actual = jest.requireActual("next/server");
  return {
    ...actual,
    after: jest.fn((callback: () => void | Promise<void>) => {
      void callback();
    }),
  };
});

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

  it("sanitizes post content before persistence", async () => {
    (getSessionUser as jest.Mock).mockResolvedValue({
      user: {
        userId: "author-1",
        name: "Author",
        accountStatus: "ACTIVE",
        role: "STUDENT",
      },
    });

    (prisma.forumHub.findFirst as jest.Mock).mockResolvedValue({
      forumID: "forum-1",
      name: "General",
    });

    (prisma.post.create as jest.Mock).mockResolvedValue({
      postID: "post-1",
      title: "",
      content: "",
      forumID: "forum-1",
      authorID: "author-1",
      moderationStatus: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
      author: { name: "Author" },
    });

    const request = new NextRequest("http://localhost/api/posts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "<script>alert(1)</script> Title",
        content: "<img onerror=alert(1)> body",
        forumId: "forum-1",
      }),
    });

    const response = await createPost(request);

    expect(response.status).toBe(201);
    expect(prisma.post.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "&lt;script&gt;alert(1)&lt;/script&gt; Title",
          content: "&lt;img onerror=alert(1)&gt; body",
        }),
      })
    );
  });

  it("sanitizes comment content before persistence", async () => {
    (verifyToken as jest.Mock).mockResolvedValue({
      id: "author-1",
      email: "author@example.com",
      role: "student",
    });

    (prisma.post.findUnique as jest.Mock).mockResolvedValue({
      postID: "post-1",
    });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      userId: "author-1",
      name: "Author",
      accountStatus: "ACTIVE",
      role: "STUDENT",
    });

    (prisma.comment.create as jest.Mock).mockResolvedValue({
      commentID: "comment-1",
      postID: "post-1",
      content: "",
      authorID: "author-1",
      createdAt: new Date(),
      author: { name: "Author" },
    });

    const request = new NextRequest("http://localhost/api/posts/post-1/comments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: "<script>alert(1)</script> hello" }),
    });

    const response = await createComment(request, {
      params: Promise.resolve({ postId: "post-1" }),
    });

    expect(response.status).toBe(201);
    expect(prisma.comment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          content: "&lt;script&gt;alert(1)&lt;/script&gt; hello",
        }),
      })
    );
  });

  it("blocks restricted users from commenting", async () => {
    (verifyToken as jest.Mock).mockResolvedValue({
      id: "author-1",
      email: "author@example.com",
      role: "student",
    });

    (prisma.post.findUnique as jest.Mock).mockResolvedValue({
      postID: "post-1",
    });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      userId: "author-1",
      name: "Author",
      accountStatus: "BANNED",
      role: "STUDENT",
    });

    const request = new NextRequest("http://localhost/api/posts/post-1/comments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: "Hello" }),
    });

    const response = await createComment(request, {
      params: Promise.resolve({ postId: "post-1" }),
    });

    expect(response.status).toBe(403);
    expect(prisma.comment.create).not.toHaveBeenCalled();
  });
});
