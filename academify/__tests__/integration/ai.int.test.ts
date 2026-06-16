/** @jest-environment node */
jest.mock("@/lib/auth-session", () => ({
  getSessionUser: jest.fn(),
  verifyToken: jest.fn(),
}));

jest.mock("@/lib/ollama", () => ({
  getOllamaConfig: jest.fn().mockReturnValue({
    baseUrl: "http://localhost:11434",
    model: "test-model",
  }),
  ollamaGenerate: jest.fn(),
}));

import { NextRequest } from "next/server";
import { POST as moderatePost } from "@/app/api/ai/moderate/route";
import { GET as healthCheck } from "@/app/api/ai/health/route";
import { verifyToken } from "@/lib/auth-session";
import { ollamaGenerate } from "@/lib/ollama";

describe("integration: AI endpoints", () => {
  const marker = `int-ai-${Date.now()}`;

  beforeAll(() => {
    (verifyToken as jest.Mock).mockResolvedValue({
      id: `${marker}-user`,
      role: "student",
    });
  });

  afterAll(async () => {
    const { prisma } = await import("@/lib/prisma");
    await prisma.$disconnect();
  });

  it("POST /api/ai/moderate returns a moderation decision", async () => {
    (ollamaGenerate as jest.Mock).mockResolvedValue({
      decision: "approve",
      toxicity: 0.05,
      spam: 0.02,
      labels: [],
      reason: "Clean content",
    });

    const request = new NextRequest("http://localhost/api/ai/moderate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: `Test post ${marker}`,
        content: "This is a test post for AI moderation integration.",
        forum: "General",
      }),
    });

    const response = await moderatePost(request);
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.decision).toBe("approve");
    expect(payload.toxicity).toBeLessThan(1);
    expect(payload.spam).toBeLessThan(1);
  });

  it("POST /api/ai/moderate flags content when AI returns flag", async () => {
    (ollamaGenerate as jest.Mock).mockResolvedValue({
      decision: "flag",
      toxicity: 0.75,
      spam: 0.1,
      labels: ["toxic"],
      reason: "Potentially toxic content detected",
    });

    const request = new NextRequest("http://localhost/api/ai/moderate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: `Toxic post ${marker}`,
        content: "This contains potentially harmful language.",
        forum: "General",
      }),
    });

    const response = await moderatePost(request);
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.decision).toBe("flag");
    expect(payload.labels).toContain("toxic");
  });

  it("POST /api/ai/moderate returns flag on AI failure", async () => {
    (ollamaGenerate as jest.Mock).mockRejectedValue(new Error("Ollama unavailable"));

    const request = new NextRequest("http://localhost/api/ai/moderate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: `Fallback post ${marker}`,
        content: "Testing AI failure fallback.",
        forum: "General",
      }),
    });

    const response = await moderatePost(request);
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.decision).toBe("flag");
    expect(payload.aiUnavailable).toBe(true);
  });

  it("GET /api/ai/health reports Ollama status", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ models: [{ name: "test-model" }] }),
    } as Response);

    (ollamaGenerate as jest.Mock).mockResolvedValue({ status: "ok" });

    const request = new NextRequest("http://localhost/api/ai/health");
    const response = await healthCheck(request);

    const payload = await response.json();
    expect(payload).toHaveProperty("ok");
    expect(payload.ok).toBe(true);
    expect(payload.model).toBe("test-model");

    fetchSpy.mockRestore();
  });

  it("GET /api/ai/health returns 503 when Ollama is unreachable", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockRejectedValue(new Error("ECONNREFUSED"));

    const request = new NextRequest("http://localhost/api/ai/health");
    const response = await healthCheck(request);
    expect(response.status).toBe(503);

    const payload = await response.json();
    expect(payload.ok).toBe(false);
    expect(payload.error).toBeDefined();

    fetchSpy.mockRestore();
  });
});
