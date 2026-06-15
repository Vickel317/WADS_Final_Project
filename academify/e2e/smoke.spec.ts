import { test, expect } from "@playwright/test";

/**
 * E2E (end-to-end) smoke tests — Playwright drives a real browser against a running app.
 * These do not replace unit/integration tests; they verify routes respond without server errors.
 *
 * Run locally: npm run dev (in one terminal) then npm run test:e2e
 * CI can start the dev server via playwright.config.ts webServer option.
 */

test.describe("Public pages", () => {
  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  });

  test("register page renders", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /create account/i })).toBeVisible();
  });
});

test.describe("Protected routes (unauthenticated)", () => {
  const protectedPaths = [
    "/dashboard",
    "/forums",
    "/messages",
    "/events",
    "/files",
    "/collaboration",
    "/setup",
    "/admin",
  ];

  for (const path of protectedPaths) {
    test(`${path} does not return 500`, async ({ request }) => {
      const response = await request.get(path, { failOnStatusCode: false, maxRedirects: 0 });
      expect(response.status()).toBeLessThan(500);
    });
  }
});

test.describe("Public API smoke", () => {
  test("GET /api/events responds without 500", async ({ request }) => {
    const response = await request.get("/api/events?filter=upcoming", { failOnStatusCode: false });
    expect(response.status()).toBeLessThan(500);
  });

  test("GET /api/categories responds with 200", async ({ request }) => {
    const response = await request.get("/api/categories", { failOnStatusCode: false });
    expect(response.status()).toBe(200);
  });
});
