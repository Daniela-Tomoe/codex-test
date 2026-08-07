import type { ReactNode } from "react";

import { PageShell } from "@/src/components/page-shell";

export default function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <PageShell sectionLabel="TinyNotes authentication">{children}</PageShell>;
}
