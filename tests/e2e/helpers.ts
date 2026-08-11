import { expect, type Page, type TestInfo } from "@playwright/test";

export type TestCredentials = {
  email: string;
  password: string;
};

export function createTestCredentials(testInfo: TestInfo, label: string): TestCredentials {
  const projectName = testInfo.project.name.replaceAll(/[^a-z0-9]/gi, "-").toLowerCase();

  return {
    email: `${label}-${projectName}-${crypto.randomUUID()}@example.com`,
    password: "correct-horse-2026",
  };
}

function forwardedAddressFor(email: string): string {
  let hash = 0;

  for (const character of email) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return `198.51.${(hash >>> 8) % 256}.${(hash % 254) + 1}`;
}

export async function registerUser(page: Page, credentials: TestCredentials) {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": forwardedAddressFor(credentials.email) });
  await page.goto("/register");
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Password").fill(credentials.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/notes$/);
  await expect(page.getByRole("heading", { level: 1, name: "Notes" })).toBeVisible();
}

export async function loginUser(page: Page, credentials: TestCredentials) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Password").fill(credentials.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/notes$/);
}

export async function createNote(page: Page, title: string, body: string): Promise<string> {
  await page.goto("/notes/new");
  const editor = page.getByRole("textbox", { name: "Note content" });
  await expect(editor).toBeVisible();
  await page.getByLabel("Note title").fill(title);
  await editor.fill(body);
  await page.getByRole("button", { name: "Create note" }).click();
  await expect(page).toHaveURL(/\/notes\/(?!new$)[^/]+$/);
  await expect(page.getByRole("status")).toHaveText("Saved");

  return page.url();
}
