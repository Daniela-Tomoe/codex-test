"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/src/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSignOut() {
    setIsPending(true);
    setErrorMessage(null);

    try {
      const { error } = await authClient.signOut();

      if (error) {
        setErrorMessage("Unable to sign out. Please try again.");
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setErrorMessage("Unable to sign out. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {errorMessage ? (
        <p className="text-sm text-red-700" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isPending}
        className="rounded-lg border border-teal-800/20 bg-white px-3 py-2 text-sm font-semibold text-teal-800 transition-colors hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}
