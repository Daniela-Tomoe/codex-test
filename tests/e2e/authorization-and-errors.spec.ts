import { expect, test } from "@playwright/test";

import { createNote, createTestCredentials, registerUser } from "./helpers";

test("notes remain isolated between users", async ({ browser, page }, testInfo) => {
  const firstUser = createTestCredentials(testInfo, "owner");
  await registerUser(page, firstUser);
  const privateNoteUrl = await createNote(page, "Owner secret", "Only the owner can read this.");

  const baseURL = testInfo.project.use.baseURL;

  if (typeof baseURL !== "string") {
    throw new Error("The E2E project must configure a string baseURL.");
  }

  const otherUserContext = await browser.newContext({
    baseURL,
    extraHTTPHeaders: { "x-forwarded-for": "203.0.113.2" },
  });
  const otherUserPage = await otherUserContext.newPage();

  try {
    await registerUser(otherUserPage, createTestCredentials(testInfo, "other-user"));

    await expect(otherUserPage.getByText("Owner secret")).toHaveCount(0);
    await otherUserPage.goto(privateNoteUrl);
    await expect(otherUserPage.getByRole("heading", { level: 1, name: "Not found" })).toBeVisible();
    await expect(otherUserPage.getByText("Only the owner can read this.")).toHaveCount(0);
  } finally {
    await otherUserContext.close();
  }
});

test("missing notes and unknown routes use the custom not-found page", async ({
  page,
}, testInfo) => {
  await registerUser(page, createTestCredentials(testInfo, "not-found"));

  await page.goto(`/notes/missing-${crypto.randomUUID()}`);
  await expect(page.getByRole("heading", { level: 1, name: "Not found" })).toBeVisible();
  await expect(page.getByText("The requested page could not be found.")).toBeVisible();

  await page.goto(`/does-not-exist-${crypto.randomUUID()}`);
  await expect(page.getByRole("heading", { level: 1, name: "Not found" })).toBeVisible();
});
