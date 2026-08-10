import type { Metadata } from "next";
import Link from "next/link";

import { requireSession } from "@/src/lib/auth-session";
import { listOwnedNotes } from "@/src/lib/notes";

export const metadata: Metadata = {
  title: "Notes | TinyNotes",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Recently" : dateFormatter.format(date);
}

export default async function NotesPage() {
  const session = await requireSession();
  const notes = listOwnedNotes(session.user.id);

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="mb-9 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold tracking-[0.18em] text-teal-700 uppercase">
            Your workspace
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">Notes</h1>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            Keep thoughts, plans, and small discoveries in one calm place.
          </p>
        </div>
        <Link
          href="/notes/new"
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 sm:self-auto"
        >
          <span aria-hidden="true" className="text-lg leading-none">
            +
          </span>
          New note
        </Link>
      </header>

      {notes.length > 0 ? (
        <section aria-labelledby="note-list-heading">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 id="note-list-heading" className="text-sm font-bold text-slate-800">
              {notes.length} {notes.length === 1 ? "note" : "notes"}
            </h2>
            <p className="text-xs text-slate-500">Most recently updated first</p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {notes.map((note) => (
              <li key={note.id}>
                <Link
                  href={`/notes/${note.id}`}
                  className="group block h-full rounded-2xl border border-teal-950/10 bg-white/90 p-5 shadow-[0_18px_50px_-38px_rgba(15,118,110,0.7)] transition hover:-translate-y-0.5 hover:border-teal-700/25 hover:shadow-[0_24px_60px_-36px_rgba(15,118,110,0.55)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                >
                  <article className="flex min-h-36 flex-col justify-between gap-8">
                    <div>
                      <h3 className="line-clamp-2 text-lg font-bold tracking-tight text-slate-950 transition-colors group-hover:text-teal-800">
                        {note.title.trim() || "Untitled note"}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Open this note to read or continue editing.
                      </p>
                    </div>
                    <p className="flex items-center justify-between gap-3 text-xs text-slate-400">
                      <span>Updated</span>
                      <time dateTime={note.updatedAt}>{formatUpdatedAt(note.updatedAt)}</time>
                    </p>
                  </article>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="rounded-3xl border border-dashed border-teal-700/25 bg-white/70 px-6 py-16 text-center shadow-sm">
          <span
            aria-hidden="true"
            className="mx-auto grid size-14 place-items-center rounded-2xl bg-teal-100 text-2xl font-light text-teal-800"
          >
            +
          </span>
          <h2 className="mt-5 text-xl font-bold text-slate-950">A fresh page</h2>
          <p className="mx-auto mt-2 max-w-md leading-7 text-slate-600">
            You don’t have any notes yet. Create one and give your next idea somewhere to land.
          </p>
          <Link
            href="/notes/new"
            className="mt-6 inline-flex rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            Create your first note
          </Link>
        </section>
      )}
    </main>
  );
}
