import type { ReactNode } from "react";

export type PageShellProps = {
  children: ReactNode;
  sectionLabel: string;
};

export function PageShell({ children, sectionLabel }: PageShellProps) {
  return (
    <div>
      <header>
        <p>{sectionLabel}</p>
      </header>
      {children}
    </div>
  );
}
