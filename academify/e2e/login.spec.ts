import { test, expect } from "@playwright/test";

test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("renders the login form", async ({ page }) => {
    await expect(page.getByText(/welcome back/i)).toBeVisible();
    await expect(page.getByPlaceholder(/john\.doe@university/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /^login$/i })).toBeVisible();
  });

  test("renders Academify branding on the left panel", async ({ page }) => {
    await expect(page.getByText("Academify").first()).toBeVisible();
    await expect(page.getByText("10K+")).toBeVisible();
  });

  test("shows email validation error for invalid email", async ({ page }) => {
    await page.getByPlaceholder(/john\.doe@university/i).fill("bademail");
    await page.getByRole("button", { name: /^login$/i }).click();
    await expect(page.getByText(/enter a valid email/i)).toBeVisible();
  });

  test("shows password required error when password is empty", async ({ page }) => {
    await page.getByPlaceholder(/john\.doe@university/i).fill("test@example.com");
    await page.getByRole("button", { name: /^login$/i }).click();
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });

  test("Register tab links to /register", async ({ page }) => {
    const registerLink = page.getByRole("link", { name: /^register$/i }).first();
    await expect(registerLink).toHaveAttribute("href", "/register");
  });

  test("remember me checkbox is toggleable", async ({ page }) => {
    const checkbox = page.getByRole("checkbox");
    await expect(checkbox).not.toBeChecked();
    await checkbox.click();
    await expect(checkbox).toBeChecked();
  });
});
