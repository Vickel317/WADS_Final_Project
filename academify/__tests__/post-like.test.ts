/** @jest-environment node */
import { GET, POST } from "@/app/api/posts/[postId]/like/route";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

jest.mock("@/lib/auth-session", () => ({
  getSessionUser: jest.fn().mockResolvedValue({
    user: { userId: "user-1", role: "student" },
  }),
}));

describe("post like API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.post.findUnique as jest.Mock).mockResolvedValue({ postID: "post-1" });
    (prisma.postLike.count as jest.Mock).mockResolvedValue(2);
    (prisma.postLike.findUnique as jest.Mock).mockResolvedValue(null);
  });

  it("returns like count and liked state", async () => {
    (prisma.postLike.findUnique as jest.Mock).mockResolvedValue({ postID: "post-1", userID: "user-1" });

    const res = await GET(new NextRequest("http://localhost/api/posts/post-1/like"), {
      params: Promise.resolve({ postId: "post-1" }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ count: 2, liked: true });
  });

  it("creates a like when toggled on", async () => {
    (prisma.postLike.create as jest.Mock).mockResolvedValue({ postID: "post-1", userID: "user-1" });
    (prisma.postLike.count as jest.Mock).mockResolvedValueOnce(1);

    const res = await POST(new NextRequest("http://localhost/api/posts/post-1/like", { method: "POST" }), {
      params: Promise.resolve({ postId: "post-1" }),
    });
    const data = await res.json();

    expect(prisma.postLike.create).toHaveBeenCalled();
    expect(data).toEqual({ liked: true, count: 1 });
  });

  it("removes a like when toggled off", async () => {
    (prisma.postLike.findUnique as jest.Mock).mockResolvedValue({ postID: "post-1", userID: "user-1" });
    (prisma.postLike.count as jest.Mock).mockResolvedValueOnce(0);

    const res = await POST(new NextRequest("http://localhost/api/posts/post-1/like", { method: "POST" }), {
      params: Promise.resolve({ postId: "post-1" }),
    });
    const data = await res.json();

    expect(prisma.postLike.delete).toHaveBeenCalled();
    expect(data).toEqual({ liked: false, count: 0 });
  });
});
