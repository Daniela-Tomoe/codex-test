import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authGetSession: vi.fn(),
  headers: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/src/lib/auth", () => ({
  auth: { api: { getSession: mocks.authGetSession } },
}));

import { getSession, redirectIfAuthenticated, requireSession } from "@/src/lib/auth-session";

const session = { session: { id: "session-1" }, user: { id: "user-1" } };

describe("auth session helpers", () => {
  beforeEach(() => {
    mocks.authGetSession.mockReset();
    mocks.headers.mockReset();
    mocks.redirect.mockReset();
    mocks.headers.mockResolvedValue(new Headers({ cookie: "session=value" }));
    mocks.redirect.mockImplementation((path: string) => {
      throw new Error(`REDIRECT:${path}`);
    });
  });

  it("forwards request headers when reading a session", async () => {
    mocks.authGetSession.mockResolvedValue(session);

    await expect(getSession()).resolves.toBe(session);
    expect(mocks.authGetSession).toHaveBeenCalledWith({ headers: expect.any(Headers) });
  });

  it("returns an authenticated session from requireSession", async () => {
    mocks.authGetSession.mockResolvedValue(session);

    await expect(requireSession()).resolves.toBe(session);
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("redirects unauthenticated callers to login", async () => {
    mocks.authGetSession.mockResolvedValue(null);

    await expect(requireSession()).rejects.toThrow("REDIRECT:/login");
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });

  it("redirects authenticated users away from public auth pages", async () => {
    mocks.authGetSession.mockResolvedValue(session);

    await expect(redirectIfAuthenticated()).rejects.toThrow("REDIRECT:/notes");
    expect(mocks.redirect).toHaveBeenCalledWith("/notes");
  });

  it("allows unauthenticated users to remain on public auth pages", async () => {
    mocks.authGetSession.mockResolvedValue(null);

    await expect(redirectIfAuthenticated()).resolves.toBeUndefined();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
