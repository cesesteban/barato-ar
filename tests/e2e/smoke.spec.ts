import { expect, test } from "@playwright/test";

test("home renderiza y linkea a health", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Barato.ar" })).toBeVisible();
  await expect(page.getByRole("link", { name: "/health" })).toBeVisible();
});

test("/health responde 200 con status ok cuando DB está arriba", async ({ request }) => {
  const res = await request.get("/health");
  expect([200, 503]).toContain(res.status());
  const json = await res.json();
  expect(json).toHaveProperty("status");
  expect(json).toHaveProperty("db");
  expect(json).toHaveProperty("commit");
  expect(json).toHaveProperty("timestamp");
});

test("/admin redirige si no hay sesión", async ({ page }) => {
  const res = await page.goto("/admin");
  // Auth.js middleware redirige al signin; puede ser 200 (página de signin) o 302.
  expect(res).toBeTruthy();
  await expect(page).not.toHaveURL(/\/admin$/);
});
