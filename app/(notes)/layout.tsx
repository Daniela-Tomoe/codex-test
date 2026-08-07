import type { ReactNode } from "react";

import { PageShell } from "@/src/components/page-shell";

export default function NotesLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <PageShell sectionLabel="TinyNotes workspace">{children}</PageShell>;
}
