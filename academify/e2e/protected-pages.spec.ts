import { test, expect } from "@playwright/test";

// NOTE: These tests assume you are authenticated / the middleware allows access.
// For a real project, add a shared auth fixture to set the session cookie.
// For now they test routing and basic page structure.

test.describe("Dashboard page", () => {
  test("loads the dashboard route without crashing", async ({ page }) => {
    // Either shows dashboard content or redirects to login
    const response = await page.goto("/dashboard");
    expect(response?.status()).toBeLessThan(500);
  });
});

test.describe("Forums page", () => {
  test("loads and shows Discussion Forums heading (or redirects to login)", async ({
    page,
  }) => {
    await page.goto("/forums");
    const url = page.url();
    const isRedirected = url.includes("/login") || url.includes("/register");
    if (!isRedirected) {
      await expect(page.getByText(/discussion forums/i)).toBeVisible();
    } else {
      // Acceptable – middleware redirected unauthenticated user
      expect(isRedirected).toBe(true);
    }
  });
});

test.describe("Messages page", () => {
  test("loads /messages without a 500 error", async ({ page }) => {
    const response = await page.goto("/messages");
    expect(response?.status()).toBeLessThan(500);
  });
});

test.describe("Profile page", () => {
  test("loads /profile/me without a 500 error", async ({ page }) => {
    const response = await page.goto("/profile/me");
    expect(response?.status()).toBeLessThan(500);
  });
});

test.describe("Profile edit page", () => {
  test("loads /profile/edit without a 500 error", async ({ page }) => {
    const response = await page.goto("/profile/edit");
    expect(response?.status()).toBeLessThan(500);
  });
});
