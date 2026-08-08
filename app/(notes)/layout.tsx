import type { ReactNode } from "react";

import { PageShell } from "@/src/components/page-shell";
import { SignOutButton } from "@/src/components/sign-out-button";

export default function NotesLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <PageShell sectionLabel="TinyNotes workspace" actions={<SignOutButton />}>
      {children}
    </PageShell>
  );
}
