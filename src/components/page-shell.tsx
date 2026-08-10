import type { ReactNode } from "react";
import Link from "next/link";

export type PageShellProps = {
  actions?: ReactNode;
  children: ReactNode;
  sectionLabel: string;
};

export function PageShell({ actions, children, sectionLabel }: PageShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#ccfbf1_0,_transparent_34%),linear-gradient(145deg,_#f8fffe_0%,_#f0fdfa_52%,_#ecfeff_100%)] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-teal-950/10 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <Link
            href="/"
            className="group flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-teal-700 text-sm font-black text-white shadow-sm transition-colors group-hover:bg-teal-800">
              T
            </span>
            <span className="min-w-0">
              <span className="block font-bold tracking-tight text-teal-950">TinyNotes</span>
              <span className="hidden truncate text-xs text-slate-500 sm:block">
                {sectionLabel}
              </span>
            </span>
          </Link>
          {actions}
        </div>
      </header>
      {children}
    </div>
  );
}
