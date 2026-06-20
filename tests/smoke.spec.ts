import { expect, test } from "@playwright/test";

const routes = [
  { path: "/", heading: /Ready to play/i },
  { path: "/tutorial", heading: /Learn Blink & Find|Tutorial|Memorize/i },
  { path: "/practice", heading: /Practice Mode/i },
  { path: "/daily", heading: /Daily Challenge/i },
  { path: "/time-attack", heading: /60-second sprint/i },
  { path: "/streak", heading: /One mistake ends it/i },
  { path: "/comfort", heading: /Bigger, calmer play/i },
  { path: "/zen", heading: /Endless calm boards/i },
  { path: "/challenge?seed=123&size=100&target=42", heading: /Shared board/i },
  { path: "/stats", heading: /Your progress/i },
  { path: "/tips", heading: /Get faster/i },
  { path: "/modes", heading: /Choose your kind of chaos/i },
  { path: "/faq", heading: /Questions, answered/i },
  { path: "/rules", heading: /Rules|How to Play/i },
];

test.describe("core route smoke tests", () => {
  for (const route of routes) {
    test(`${route.path} renders`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page.getByRole("heading", { name: route.heading }).first()).toBeVisible();
    });
  }
});

test("home exposes primary mode navigation", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: /Daily/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Practice/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Time Attack/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Streak/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Comfort/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Zen/i })).toBeVisible();
});

test("shared challenge keeps the same seed in copied link UI", async ({ page }) => {
  await page.goto("/challenge?seed=123&size=100&target=42");

  await expect(page.getByText(/seed 123/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /Start Challenge/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Copy Challenge Link/i })).toBeVisible();
});

test("comfort mode can start a gentle round", async ({ page }) => {
  await page.goto("/comfort");
  await page.getByRole("button", { name: /^Start$/i }).click();
  await expect(page.getByText(/Target hides in|Look at the target/i)).toBeVisible();
});

test("sitemap includes new feature routes", async ({ page }) => {
  const response = await page.goto("/sitemap.xml");
  expect(response?.ok()).toBeTruthy();
  const text = await page.textContent("body");

  expect(text).toContain("/challenge");
  expect(text).toContain("/comfort");
  expect(text).toContain("/zen");
  expect(text).toContain("/tips");
  expect(text).toContain("/modes");
  expect(text).toContain("/faq");
});
