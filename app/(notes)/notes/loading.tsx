export default function NotesLoading() {
  return (
    <main className="mx-auto w-full max-w-7xl animate-pulse px-5 py-10 sm:px-8 sm:py-14">
      <div className="h-3 w-28 rounded-full bg-teal-200" />
      <div className="mt-4 h-12 w-56 rounded-2xl bg-slate-200" />
      <div className="mt-4 h-5 max-w-xl rounded-full bg-slate-200" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="h-44 rounded-2xl border border-teal-950/5 bg-white/70 shadow-sm"
          />
        ))}
      </div>
      <span className="sr-only">Loading notes…</span>
    </main>
  );
}
