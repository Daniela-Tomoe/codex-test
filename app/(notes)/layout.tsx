import type { ReactNode } from "react";

import { PageShell } from "@/src/components/page-shell";
import { SignOutButton } from "@/src/components/sign-out-button";
import { requireSession } from "@/src/lib/auth-session";

export default async function NotesLayout({ children }: Readonly<{ children: ReactNode }>) {
  const session = await requireSession();

  return (
    <PageShell
      sectionLabel="Your private workspace"
      actions={
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <p className="hidden min-w-0 text-right sm:block">
            <span className="block truncate text-sm font-semibold text-slate-800">
              {session.user.name}
            </span>
            <span className="block truncate text-xs text-slate-500">{session.user.email}</span>
          </p>
          <SignOutButton />
        </div>
      }
    >
      {children}
    </PageShell>
  );
}
