import { expect, test } from "@playwright/test";

import { createNote, createTestCredentials, registerUser } from "./helpers";

test.beforeEach(async ({ page }, testInfo) => {
  await registerUser(page, createTestCredentials(testInfo, "notes"));
});

test("creates a note, autosaves edits, and persists them across navigation", async ({ page }) => {
  const noteUrl = await createNote(page, "Initial title", "Initial body");

  await page.getByLabel("Note title").fill("Persisted title");
  const editor = page.getByRole("textbox", { name: "Note content" });
  await editor.fill("Persisted body");
  await expect(page.getByRole("status")).toHaveText("Unsaved changes");
  await expect(page.getByRole("status")).toHaveText("Saved", { timeout: 15_000 });

  await page.reload();
  await expect(page.getByLabel("Note title")).toHaveValue("Persisted title");
  await expect(editor).toContainText("Persisted body");

  await page.getByRole("link", { name: "All notes" }).click();
  await expect(page).toHaveURL(/\/notes$/);
  await expect(page.getByRole("heading", { level: 3, name: "Persisted title" })).toBeVisible();

  await page.locator(`a[href="${new URL(noteUrl).pathname}"]`).click();
  await expect(page).toHaveURL(noteUrl);
});

test("shows untitled notes and keeps the most recently updated note first", async ({ page }) => {
  await createNote(page, "Older note", "First body");
  await createNote(page, "Newer note", "Second body");
  await page.goto("/notes");

  const noteHeadings = page.locator("article h3");
  await expect(noteHeadings).toHaveCount(2);
  await expect(noteHeadings.nth(0)).toHaveText("Newer note");
  await expect(noteHeadings.nth(1)).toHaveText("Older note");
  await expect(page.getByText("2 notes")).toBeVisible();

  await createNote(page, "", "An unnamed idea");
  await page.goto("/notes");
  await expect(page.getByRole("heading", { level: 3, name: "Untitled note" })).toBeVisible();
  await expect(page.getByText("3 notes")).toBeVisible();
});

test("formats rich text, validates links, and supports undo and redo", async ({ page }) => {
  await page.goto("/notes/new");
  const editor = page.getByRole("textbox", { name: "Note content" });
  await editor.fill("Formatted text");
  await editor.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  await page.getByRole("button", { name: "Bold" }).click();
  await expect(editor.locator("strong")).toHaveText("Formatted text");

  await editor.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  await page.getByRole("button", { name: "Edit link" }).click();
  await page.getByLabel("Link address").fill("example.com/docs");
  await page.getByRole("button", { name: "Apply link" }).click();
  const link = editor.getByRole("link", { name: "Formatted text" });
  await expect(link).toHaveAttribute("href", "https://example.com/docs");
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", "noopener noreferrer");

  await editor.press("End");
  await editor.type(" more");
  await expect(page.getByRole("button", { name: "Undo" })).toBeEnabled();
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(editor).not.toContainText("more");
  await page.getByRole("button", { name: "Redo" }).click();
  await expect(editor).toContainText("more");

  await editor.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  await page.getByRole("button", { name: "Edit link" }).click();
  await page.getByLabel("Link address").fill("javascript:alert(1)");
  await page.getByRole("button", { name: "Apply link" }).click();
  await expect(
    page.getByText("Enter a valid HTTP or HTTPS address.", { exact: true }),
  ).toBeVisible();
});

test("clears content only after confirmation", async ({ page }) => {
  await page.goto("/notes/new");
  const editor = page.getByRole("textbox", { name: "Note content" });
  await editor.fill("Keep this until confirmed");

  await page.getByRole("button", { name: "Clear content" }).click();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(editor).toContainText("Keep this until confirmed");

  await page.getByRole("button", { name: "Clear content" }).click();
  await page.getByRole("button", { name: "Confirm clear" }).click();
  await expect(editor).toBeEmpty();
});
