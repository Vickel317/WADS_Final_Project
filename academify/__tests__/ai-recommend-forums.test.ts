/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET as forumRecommendGet } from "@/app/api/ai/recommend/forums/route";
import { verifyToken } from "@/lib/auth-session";
import { resetAiRateLimitsForTests } from "@/lib/ai/rate-limit";
import { ollamaGenerate } from "@/lib/ollama";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/auth-session", () => ({
  verifyToken: jest.fn(),
}));

jest.mock("@/lib/ollama", () => ({
  ollamaGenerate: jest.fn(),
}));

jest.mock("@/lib/storage", () => ({
  getPresignedGetUrl: jest.fn().mockResolvedValue("https://example.com/image.png"),
}));

jest.mock("@/lib/ai/recommend-context", () => ({
  getRecommendUserContext: jest.fn().mockResolvedValue({
    profile: {
      major: "Computer Science",
      bio: "Likes web dev",
      skillTags: ["react", "typescript"],
      academicLevel: "Undergraduate",
    },
    joinedForumIds: ["forum_joined"],
    joinedForumNames: ["Joined Forum"],
  }),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    forumHub: {
      findMany: jest.fn(),
    },
  },
}));

describe("GET /api/ai/recommend/forums", () => {
  beforeEach(() => {
    resetAiRateLimitsForTests();
    jest.clearAllMocks();
    (verifyToken as jest.Mock).mockResolvedValue({
      id: "user_1",
      role: "student",
    });
    (prisma.forumHub.findMany as jest.Mock).mockResolvedValue([
      {
        forumID: "forum_1",
        name: "Computer Science",
        description: "Algorithms and programming",
        imageUrl: null,
      },
      {
        forumID: "forum_joined",
        name: "Joined Forum",
        description: "Already joined",
        imageUrl: null,
      },
    ]);
  });

  it("returns enriched forum recommendations", async () => {
    (ollamaGenerate as jest.Mock).mockResolvedValue({
      recommendations: [{ forumID: "forum_1", score: 0.91, reason: "Matches your major" }],
    });

    const request = new NextRequest("http://localhost/api/ai/recommend/forums");
    const response = await forumRecommendGet(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.recommendations[0]).toMatchObject({
      forumID: "forum_1",
      slug: "computer-science",
      name: "Computer Science",
      reason: "Matches your major",
    });
  });

  it("falls back to heuristic scoring when AI is unavailable", async () => {
    (ollamaGenerate as jest.Mock).mockRejectedValue(new Error("offline"));

    const request = new NextRequest("http://localhost/api/ai/recommend/forums");
    const response = await forumRecommendGet(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.fallback).toBe(true);
    expect(body.recommendations.length).toBeGreaterThan(0);
  });

  it("falls back to heuristic scoring when rate limited", async () => {
    (ollamaGenerate as jest.Mock).mockResolvedValue({
      recommendations: [{ forumID: "forum_1", score: 0.91, reason: "Matches your major" }],
    });

    const request1 = new NextRequest("http://localhost/api/ai/recommend/forums");
    await forumRecommendGet(request1);

    const request2 = new NextRequest("http://localhost/api/ai/recommend/forums");
    const response = await forumRecommendGet(request2);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.fallback).toBe(true);
    expect(body.recommendations.length).toBeGreaterThan(0);
    expect(ollamaGenerate).toHaveBeenCalledTimes(1);
  });
});
