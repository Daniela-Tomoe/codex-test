import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  replace: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh, replace: mocks.replace }),
}));
vi.mock("@/src/lib/auth-client", () => ({ authClient: { signOut: mocks.signOut } }));

import { SignOutButton } from "@/src/components/sign-out-button";

describe("SignOutButton", () => {
  beforeEach(() => {
    mocks.refresh.mockReset();
    mocks.replace.mockReset();
    mocks.signOut.mockReset();
  });

  it("signs out and returns to login", async () => {
    mocks.signOut.mockResolvedValue({ error: null });
    render(<SignOutButton />);

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/login"));
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it.each(["result", "throw"])("shows a generic error for a sign-out %s failure", async (kind) => {
    if (kind === "result") {
      mocks.signOut.mockResolvedValue({ error: { message: "provider detail" } });
    } else {
      mocks.signOut.mockRejectedValue(new Error("network detail"));
    }
    render(<SignOutButton />);

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Unable to sign out. Please try again.",
    );
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("disables repeated sign-out attempts while pending", async () => {
    let resolveSignOut: ((value: { error: null }) => void) | undefined;
    mocks.signOut.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSignOut = resolve;
        }),
    );
    render(<SignOutButton />);

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    const pendingButton = await screen.findByRole("button", { name: "Signing out…" });
    expect(pendingButton).toHaveProperty("disabled", true);
    fireEvent.click(pendingButton);
    expect(mocks.signOut).toHaveBeenCalledOnce();

    resolveSignOut?.({ error: null });
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/login"));
  });
});
