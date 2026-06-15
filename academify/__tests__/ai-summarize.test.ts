/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET as summarizeGet } from "@/app/api/ai/summarize/[postId]/route";
import { resetAiRateLimitsForTests } from "@/lib/ai/rate-limit";
import { verifyToken } from "@/lib/auth-session";
import { ollamaGenerate } from "@/lib/ollama";
import { prisma } from "@/lib/prisma";
import { ModerationStatus } from "@prisma/client";

jest.mock("@/lib/auth-session", () => ({
  verifyToken: jest.fn(),
}));

jest.mock("@/lib/ollama", () => ({
  ollamaGenerate: jest.fn(),
  getOllamaConfig: jest.fn(() => ({
    baseUrl: "https://ollama.test",
    model: "llama3.1:8b",
    timeoutMs: 60000,
  })),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    post: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    comment: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
}));

const basePost = {
  postID: "post_1",
  authorID: "user_author",
  title: "Hidden thread",
  content: "Secret content",
  moderationStatus: ModerationStatus.FLAGGED,
  summaryJson: null,
  summaryAt: null,
  summaryCommentCount: null,
  comments: [{ content: "First reply" }],
  _count: { comments: 1 },
};

describe("GET /api/ai/summarize/[postId]", () => {
  beforeEach(() => {
    resetAiRateLimitsForTests();
    jest.clearAllMocks();
    (prisma.comment.findMany as jest.Mock).mockResolvedValue([
      { content: "First reply", createdAt: new Date(), _count: { likes: 0 } },
    ]);
  });

  it("returns 404 for hidden posts when viewer is not allowed", async () => {
    (verifyToken as jest.Mock).mockResolvedValue({
      id: "user_other",
      role: "student",
    });
    (prisma.post.findUnique as jest.Mock).mockResolvedValue(basePost);

    const request = new NextRequest("http://localhost/api/ai/summarize/post_1");
    const response = await summarizeGet(request, {
      params: Promise.resolve({ postId: "post_1" }),
    });

    expect(response.status).toBe(404);
    expect(ollamaGenerate).not.toHaveBeenCalled();
  });

  it("returns cached summary without calling Ollama on cache hit", async () => {
    (verifyToken as jest.Mock).mockResolvedValue({
      id: "user_author",
      role: "student",
    });
    (prisma.post.findUnique as jest.Mock).mockResolvedValue({
      ...basePost,
      moderationStatus: ModerationStatus.APPROVED,
      summaryJson: {
        summary: "Cached summary",
        keyPoints: ["Point A"],
        openQuestions: [],
      },
      summaryAt: new Date("2026-06-14T10:00:00.000Z"),
      summaryCommentCount: 1,
    });

    const request = new NextRequest("http://localhost/api/ai/summarize/post_1");
    const response = await summarizeGet(request, {
      params: Promise.resolve({ postId: "post_1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.summary).toBe("Cached summary");
    expect(body.cached).toBe(true);
    expect(body.model).toBe("llama3.1:8b");
    expect(ollamaGenerate).not.toHaveBeenCalled();
    expect(prisma.post.update).not.toHaveBeenCalled();
  });

  it("generates and caches summary on cache miss", async () => {
    (verifyToken as jest.Mock).mockResolvedValue({
      id: "user_author",
      role: "student",
    });
    (prisma.post.findUnique as jest.Mock).mockResolvedValue({
      ...basePost,
      moderationStatus: ModerationStatus.APPROVED,
    });
    (ollamaGenerate as jest.Mock).mockResolvedValue({
      summary: "Fresh summary",
      keyPoints: ["Fresh point"],
      openQuestions: ["Any follow-ups?"],
    });
    (prisma.post.update as jest.Mock).mockResolvedValue({});

    const request = new NextRequest("http://localhost/api/ai/summarize/post_1");
    const response = await summarizeGet(request, {
      params: Promise.resolve({ postId: "post_1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.summary).toBe("Fresh summary");
    expect(body.cached).toBe(false);
    expect(body.commentCount).toBe(1);
    expect(body.model).toBe("llama3.1:8b");
    expect(ollamaGenerate).toHaveBeenCalledTimes(1);
    expect(prisma.post.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { postID: "post_1" },
        data: expect.objectContaining({
          summaryCommentCount: 1,
          summaryJson: expect.objectContaining({ summary: "Fresh summary" }),
        }),
      })
    );
  });

  it("bypasses cache when refresh=1", async () => {
    (verifyToken as jest.Mock).mockResolvedValue({
      id: "user_author",
      role: "student",
    });
    (prisma.post.findUnique as jest.Mock).mockResolvedValue({
      ...basePost,
      moderationStatus: ModerationStatus.APPROVED,
      summaryJson: {
        summary: "Cached summary",
        keyPoints: ["Point A"],
        openQuestions: [],
      },
      summaryAt: new Date("2026-06-14T10:00:00.000Z"),
      summaryCommentCount: 1,
    });
    (ollamaGenerate as jest.Mock).mockResolvedValue({
      summary: "Regenerated summary",
      keyPoints: ["New point"],
      openQuestions: [],
    });
    (prisma.post.update as jest.Mock).mockResolvedValue({});

    const request = new NextRequest("http://localhost/api/ai/summarize/post_1?refresh=1");
    const response = await summarizeGet(request, {
      params: Promise.resolve({ postId: "post_1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.summary).toBe("Regenerated summary");
    expect(body.cached).toBe(false);
    expect(ollamaGenerate).toHaveBeenCalledTimes(1);
  });

  it("strips empty open questions from AI output", async () => {
    (verifyToken as jest.Mock).mockResolvedValue({
      id: "user_author",
      role: "student",
    });
    (prisma.post.findUnique as jest.Mock).mockResolvedValue({
      ...basePost,
      moderationStatus: ModerationStatus.APPROVED,
    });
    (ollamaGenerate as jest.Mock).mockResolvedValue({
      summary: "Summary",
      keyPoints: ["Point"],
      openQuestions: ["", "  "],
    });
    (prisma.post.update as jest.Mock).mockResolvedValue({});

    const request = new NextRequest("http://localhost/api/ai/summarize/post_1");
    const response = await summarizeGet(request, {
      params: Promise.resolve({ postId: "post_1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.openQuestions).toEqual([]);
  });
});
