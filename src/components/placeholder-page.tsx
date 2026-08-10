import type { ReactNode } from "react";

export type PlaceholderPageProps = {
  children?: ReactNode;
  description: string;
  title: string;
};

export function PlaceholderPage({ children, description, title }: PlaceholderPageProps) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center px-5 py-12 text-center sm:px-8">
      <section className="w-full rounded-3xl border border-teal-950/10 bg-white/90 p-8 shadow-[0_24px_80px_-40px_rgba(15,118,110,0.45)] sm:p-12">
        <p className="mb-3 text-xs font-bold tracking-[0.18em] text-teal-700 uppercase">
          TinyNotes
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-600">{description}</p>
        {children}
      </section>
    </main>
  );
}
