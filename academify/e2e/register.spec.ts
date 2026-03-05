import { test, expect } from "@playwright/test";

test.describe("Register page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/register");
  });

  test("renders the registration form", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /create account/i })).toBeVisible();
    await expect(page.getByPlaceholder(/john doe/i)).toBeVisible();
    await expect(page.getByPlaceholder(/john\.doe@university/i)).toBeVisible();
    await expect(page.getByPlaceholder(/min\. 8 characters/i)).toBeVisible();
    await expect(page.getByPlaceholder(/re-enter your password/i)).toBeVisible();
  });

  test("shows name required error", async ({ page }) => {
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page.getByText(/full name is required/i)).toBeVisible();
  });

  test("shows password mismatch error", async ({ page }) => {
    await page.getByPlaceholder(/john doe/i).fill("Jane Doe");
    await page.getByPlaceholder(/john\.doe@university/i).fill("jane@example.com");
    await page.getByPlaceholder(/min\. 8 characters/i).fill("password123");
    await page.getByPlaceholder(/re-enter your password/i).fill("different456");
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });

  test("terms checkbox is interactable", async ({ page }) => {
    const checkbox = page.getByRole("checkbox");
    await expect(checkbox).not.toBeChecked();
    await checkbox.click();
    await expect(checkbox).toBeChecked();
  });

  test("Login tab links to /login", async ({ page }) => {
    const loginLink = page.getByRole("link", { name: /^login$/i }).first();
    await expect(loginLink).toHaveAttribute("href", "/login");
  });
});
