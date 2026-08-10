"use client";

type NotesErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function NotesError({ reset }: NotesErrorProps) {
  function handleRetry() {
    reset();
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center px-5 py-12 text-center sm:px-8">
      <section className="w-full rounded-3xl border border-red-200 bg-white/90 p-8 shadow-sm sm:p-12">
        <p className="text-xs font-bold tracking-[0.18em] text-red-700 uppercase">
          Notes unavailable
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
          We couldn’t open your notes
        </h1>
        <p className="mx-auto mt-4 max-w-lg leading-7 text-slate-600">
          Something temporary got in the way. Your notes have not been changed.
        </p>
        <button
          type="button"
          onClick={handleRetry}
          className="mt-7 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
