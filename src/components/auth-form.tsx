import Link from "next/link";

type AuthMode = "login" | "register";

export type AuthFormProps = {
  mode: AuthMode;
};

const content = {
  login: {
    eyebrow: "Welcome back",
    title: "Log in to your notes",
    description: "Your ideas are waiting right where you left them.",
    submitLabel: "Log in",
    switchPrompt: "New to TinyNotes?",
    switchLabel: "Create an account",
    switchHref: "/register",
  },
  register: {
    eyebrow: "Get started",
    title: "Create your account",
    description: "A simple, quiet place for every note worth keeping.",
    submitLabel: "Create account",
    switchPrompt: "Already have an account?",
    switchLabel: "Log in",
    switchHref: "/login",
  },
} as const;

export function AuthForm({ mode }: AuthFormProps) {
  const copy = content[mode];

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-5 py-12 sm:px-8">
      <section className="w-full max-w-md rounded-3xl border border-teal-950/10 bg-white/90 p-7 shadow-[0_24px_80px_-32px_rgba(15,118,110,0.35)] sm:p-10">
        <div className="mb-8">
          <p className="mb-3 text-xs font-bold tracking-[0.18em] text-teal-700 uppercase">
            {copy.eyebrow}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">{copy.title}</h1>
          <p className="mt-3 leading-7 text-slate-600">{copy.description}</p>
        </div>

        <form className="space-y-5" method="post">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-800">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-800">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              placeholder="Enter your password"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-teal-700 px-4 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            {copy.submitLabel}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-slate-600">
          {copy.switchPrompt}{" "}
          <Link href={copy.switchHref} className="font-semibold text-teal-700 hover:text-teal-900">
            {copy.switchLabel}
          </Link>
        </p>
      </section>
    </main>
  );
}
