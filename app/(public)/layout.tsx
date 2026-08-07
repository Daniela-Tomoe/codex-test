import type { ReactNode } from "react";
import Link from "next/link";

export default function PublicLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#ccfbf1_0,_transparent_38%),linear-gradient(135deg,_#f8fffe_0%,_#f0fdfa_55%,_#ecfeff_100%)] text-slate-900">
      <header className="border-b border-teal-950/10 bg-white/75 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-teal-950 transition-colors hover:text-teal-700"
          >
            TinyNotes
          </Link>

          <nav aria-label="Authentication" className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-teal-50 hover:text-teal-800"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800"
            >
              Register
            </Link>
          </nav>
        </div>
      </header>

      {children}
    </div>
  );
}
