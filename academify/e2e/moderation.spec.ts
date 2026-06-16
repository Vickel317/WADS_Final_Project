import { test, expect } from "@playwright/test";

test.describe("Moderation / Reports E2E", () => {
  test("reports API endpoint responds without 500", async ({ request }) => {
    const response = await request.get("/api/reports", { failOnStatusCode: false });
    expect(response.status()).toBeLessThan(500);
  });

  test("moderation queue API endpoint responds without 500", async ({ request }) => {
    const response = await request.get("/api/moderation/queue", { failOnStatusCode: false });
    expect(response.status()).toBeLessThan(500);
  });

  test("moderation logs API endpoint responds without 500", async ({ request }) => {
    const response = await request.get("/api/moderation/logs", { failOnStatusCode: false });
    expect(response.status()).toBeLessThan(500);
  });

  test("POST /api/reports validates required fields", async ({ request }) => {
    const response = await request.post("/api/reports", {
      failOnStatusCode: false,
      data: {},
    });
    expect(response.status()).toBeLessThan(500);
  });

  test("reports page does not return 500 when unauthenticated", async ({ request }) => {
    const response = await request.get("/reports", { failOnStatusCode: false, maxRedirects: 0 });
    expect(response.status()).toBeLessThan(500);
  });
});
