import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  replace: vi.fn(),
  signInEmail: vi.fn(),
  signUpEmail: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh, replace: mocks.replace }),
}));
vi.mock("@/src/lib/auth-client", () => ({
  authClient: {
    signIn: { email: mocks.signInEmail },
    signUp: { email: mocks.signUpEmail },
  },
}));

import { AuthForm } from "@/src/components/auth-form";

function submitVisibleForm() {
  const submitButton = screen.getByRole("button");
  const form = submitButton.closest("form");

  if (!form) {
    throw new Error("Expected the authentication form to be rendered.");
  }

  fireEvent.submit(form);
}

function fillCredentials(email: string, password: string) {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
}

describe("AuthForm", () => {
  beforeEach(() => {
    mocks.refresh.mockReset();
    mocks.replace.mockReset();
    mocks.signInEmail.mockReset();
    mocks.signUpEmail.mockReset();
  });

  it("renders accessible login controls and navigation", () => {
    render(<AuthForm mode="login" />);

    expect(screen.getByRole("heading", { level: 1, name: "Log in to your notes" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Log in" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Create an account" }).getAttribute("href")).toBe(
      "/register",
    );
    expect(screen.getByLabelText("Password").getAttribute("autocomplete")).toBe("current-password");
  });

  it("renders registration-specific copy and password autocomplete", () => {
    render(<AuthForm mode="register" />);

    expect(screen.getByRole("heading", { name: "Create your account" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Log in" }).getAttribute("href")).toBe("/login");
    expect(screen.getByLabelText("Password").getAttribute("autocomplete")).toBe("new-password");
  });

  it("normalizes login email and navigates after success", async () => {
    mocks.signInEmail.mockResolvedValue({ error: null });
    render(<AuthForm mode="login" />);
    fillCredentials("  PERSON@Example.COM ", "password123");

    submitVisibleForm();

    await waitFor(() => {
      expect(mocks.signInEmail).toHaveBeenCalledWith({
        email: "person@example.com",
        password: "password123",
      });
    });
    expect(mocks.replace).toHaveBeenCalledWith("/notes");
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("derives a registration name and navigates after success", async () => {
    mocks.signUpEmail.mockResolvedValue({ error: null });
    render(<AuthForm mode="register" />);
    fillCredentials("NEW.USER@example.com", "password123");

    submitVisibleForm();

    await waitFor(() => {
      expect(mocks.signUpEmail).toHaveBeenCalledWith({
        email: "new.user@example.com",
        name: "new.user",
        password: "password123",
      });
    });
    expect(mocks.replace).toHaveBeenCalledWith("/notes");
  });

  it.each([
    ["login" as const, "Unable to log in with those credentials."],
    ["register" as const, "Unable to create an account with those details."],
  ])("shows a generic %s rejection", async (mode, expectedMessage) => {
    const authMethod = mode === "login" ? mocks.signInEmail : mocks.signUpEmail;
    authMethod.mockResolvedValue({ error: { message: "sensitive provider detail" } });
    render(<AuthForm mode={mode} />);
    fillCredentials("person@example.com", "password123");

    submitVisibleForm();

    expect((await screen.findByRole("alert")).textContent).toBe(expectedMessage);
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("shows a generic availability error when the auth client throws", async () => {
    mocks.signInEmail.mockRejectedValue(new Error("network details"));
    render(<AuthForm mode="login" />);
    fillCredentials("person@example.com", "password123");

    submitVisibleForm();

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Authentication is temporarily unavailable. Please try again.",
    );
  });

  it("disables the form while authentication is pending", async () => {
    let resolveAuthentication: ((value: { error: null }) => void) | undefined;
    mocks.signInEmail.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAuthentication = resolve;
        }),
    );
    render(<AuthForm mode="login" />);
    fillCredentials("person@example.com", "password123");

    submitVisibleForm();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Please wait…" })).toHaveProperty("disabled", true);
    });
    expect(screen.getByLabelText("Email")).toHaveProperty("disabled", true);
    expect(screen.getByLabelText("Password")).toHaveProperty("disabled", true);

    resolveAuthentication?.({ error: null });
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/notes"));
  });
});
