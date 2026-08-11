import { rm } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dir, "..");
const expectedDatabasePath = resolve(projectRoot, "data", "tinynotes-e2e.db");
const configuredDatabasePath = process.env.DB_PATH?.trim();

if (!configuredDatabasePath) {
  throw new Error("DB_PATH must be configured before preparing the E2E database.");
}

const databasePath = resolve(projectRoot, configuredDatabasePath);

if (databasePath !== expectedDatabasePath) {
  throw new Error(`Refusing to reset unexpected E2E database path: ${databasePath}`);
}

for (const suffix of ["", "-shm", "-wal"]) {
  await rm(`${databasePath}${suffix}`, { force: true });
}

const migrationProcess = Bun.spawn([process.execPath, "run", "db:migrate"], {
  cwd: projectRoot,
  env: process.env,
  stderr: "inherit",
  stdout: "inherit",
});
const migrationExitCode = await migrationProcess.exited;

if (migrationExitCode !== 0) {
  throw new Error(`E2E database migration failed with exit code ${migrationExitCode}.`);
}

console.log(`Prepared isolated E2E database at ${databasePath}`);
