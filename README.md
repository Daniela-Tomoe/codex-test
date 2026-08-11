# TinyNotes

TinyNotes is a Next.js App Router application running on Bun with a SQLite database and
Better Auth email/password authentication.

## Getting Started

Create a local `.env` file before starting the application:

```dotenv
DB_PATH=./data/tinynotes.db
AUTH_SECRET=replace-with-at-least-32-random-characters
APP_URL=http://localhost:3000
```

Use a cryptographically random value for `AUTH_SECRET`; do not commit the value. `APP_URL`
must be the public origin from which the app is served.

Install dependencies, apply the existing raw SQL migrations, and start the Bun development
server:

```bash
bun install
bun run db:migrate
bun run dev
```

Open [http://localhost:3000](http://localhost:3000). Registration and login use email and
password credentials; password reset and email verification are intentionally unavailable.

## Validation

```bash
bun run format
bun run lint
bun tsc --noEmit
bun run test
bun run test:e2e
bun run build
```

## Testing

Unit and component tests use Vitest with React Testing Library. Run them once or in watch
mode:

```bash
bun run test
bun run test:watch
```

End-to-end tests use Playwright against a production Next.js build and an isolated SQLite
database at `data/tinynotes-e2e.db`. Install the browser binaries once, then run the suite:

```bash
bunx playwright install
bun run test:e2e
```

Playwright resets only the dedicated E2E database before each run. It never reads or modifies
the development database configured in `.env.local`. Use `bun run test:e2e:ui` for Playwright's
interactive runner, or `bun run test:all` to run both suites.
