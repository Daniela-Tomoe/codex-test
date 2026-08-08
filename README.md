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
bun run build
```
