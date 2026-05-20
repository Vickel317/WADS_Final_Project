import { test, expect } from "@playwright/test";

// These tests validate that protected routes do not crash and can redirect when unauthenticated.
test.skip(true, "Protected route checks require stable BetterAuth session/database in e2e environment.");

test.describe("Dashboard page", () => {
  test("loads the dashboard route without crashing", async ({ request }) => {
    const response = await request.get("/dashboard", { failOnStatusCode: false, maxRedirects: 0 });
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe("Forums page", () => {
  test("loads and shows Discussion Forums heading (or redirects to login)", async ({ request }) => {
    const response = await request.get("/forums", { failOnStatusCode: false, maxRedirects: 0 });
    expect(response.status()).toBeLessThan(500);

    if (response.status() >= 300 && response.status() < 400) {
      const location = response.headers()["location"] || "";
      expect(location.includes("/login") || location.includes("/register")).toBe(true);
      return;
    }

    const html = await response.text();
    expect(/discussion forums/i.test(html)).toBe(true);
  });
});

test.describe("Messages page", () => {
  test("loads /messages without a 500 error", async ({ request }) => {
    const response = await request.get("/messages", { failOnStatusCode: false, maxRedirects: 0 });
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe("Profile page", () => {
  test("loads /profile/me without a 500 error", async ({ request }) => {
    const response = await request.get("/profile/me", { failOnStatusCode: false, maxRedirects: 0 });
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe("Profile edit page", () => {
  test("loads /profile/edit without a 500 error", async ({ request }) => {
    const response = await request.get("/profile/edit", { failOnStatusCode: false, maxRedirects: 0 });
    expect(response.status()).toBeLessThan(500);
  });
});
