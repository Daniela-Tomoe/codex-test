import type { ReactNode } from "react";

import { PageShell } from "@/src/components/page-shell";

export default function PublicLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <PageShell sectionLabel="TinyNotes shared note">{children}</PageShell>;
}
