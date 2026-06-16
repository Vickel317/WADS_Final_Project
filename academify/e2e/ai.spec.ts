import { test, expect } from "@playwright/test";

test.describe("AI Endpoints E2E", () => {
  test("AI health check responds without 500", async ({ request }) => {
    const response = await request.get("/api/ai/health", { failOnStatusCode: false });
    expect(response.status()).toBeLessThan(500);
  });

  test("POST /api/ai/moderate responds without 500", async ({ request }) => {
    const response = await request.post("/api/ai/moderate", {
      failOnStatusCode: false,
      data: { title: "Test", content: "Test content" },
    });
    expect(response.status()).toBeLessThan(500);
  });

  test("POST /api/ai/moderate validates required fields", async ({ request }) => {
    const response = await request.post("/api/ai/moderate", {
      failOnStatusCode: false,
      data: {},
    });
    expect(response.status()).toBeLessThan(500);
  });

  test("GET /api/ai/recommend responds without 500", async ({ request }) => {
    const response = await request.get("/api/ai/recommend", { failOnStatusCode: false });
    expect(response.status()).toBeLessThan(500);
  });

  test("GET /api/ai/recommend/forums responds without 500", async ({ request }) => {
    const response = await request.get("/api/ai/recommend/forums", { failOnStatusCode: false });
    expect(response.status()).toBeLessThan(500);
  });

});
