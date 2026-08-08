import type { ReactNode } from "react";

export type PageShellProps = {
  actions?: ReactNode;
  children: ReactNode;
  sectionLabel: string;
};

export function PageShell({ actions, children, sectionLabel }: PageShellProps) {
  return (
    <div>
      <header className="border-b border-teal-950/10 bg-white">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <p className="font-semibold text-teal-950">{sectionLabel}</p>
          {actions}
        </div>
      </header>
      {children}
    </div>
  );
}
