import { expect, test } from "@playwright/test";

import { createTestCredentials, loginUser, registerUser } from "./helpers";

test("guests are redirected from private routes", async ({ page }) => {
  for (const route of ["/", "/notes", "/notes/new", "/notes/missing-note"]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Log in to your notes" })).toBeVisible();
  }
});

test("registration creates a persistent session and public auth pages redirect", async ({
  page,
}, testInfo) => {
  const credentials = createTestCredentials(testInfo, "register");

  await registerUser(page, credentials);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Notes" })).toBeVisible();

  await page.goto("/");
  await expect(page).toHaveURL(/\/notes$/);
  await page.goto("/login");
  await expect(page).toHaveURL(/\/notes$/);
  await page.goto("/register");
  await expect(page).toHaveURL(/\/notes$/);
});

test("a user can sign out, is protected immediately, and can log back in", async ({
  page,
}, testInfo) => {
  const credentials = createTestCredentials(testInfo, "roundtrip");
  await registerUser(page, credentials);

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/notes");
  await expect(page).toHaveURL(/\/login$/);

  await loginUser(page, credentials);
  await expect(page.getByText(credentials.email)).toBeVisible();
});

test("invalid credentials produce a generic error without navigating", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(`missing-${crypto.randomUUID()}@example.com`);
  await page.getByLabel("Password").fill("incorrect-password");
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByText("Unable to log in with those credentials.", { exact: true }),
  ).toBeVisible();
});
