import { Database } from "bun:sqlite";
import { mkdir, readdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

type MigrationRow = {
  version: string;
};

const projectRoot = resolve(import.meta.dir, "..");
const migrationsDirectory = resolve(projectRoot, "migrations");
const configuredDatabasePath = process.env.DB_PATH?.trim() || "./data/tinynotes.db";
const databasePath =
  configuredDatabasePath === ":memory:"
    ? configuredDatabasePath
    : resolve(process.cwd(), configuredDatabasePath);

async function migrate() {
  if (databasePath !== ":memory:") {
    await mkdir(dirname(databasePath), { recursive: true });
  }

  const migrationFiles = (await readdir(migrationsDirectory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  const database = new Database(databasePath, { create: true, strict: true });

  try {
    database.run("PRAGMA foreign_keys = ON;");
    database.run(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL
      );
    `);

    const appliedMigrations = new Set(
      (database.query("SELECT version FROM schema_migrations;").all() as MigrationRow[]).map(
        ({ version }) => version,
      ),
    );
    const recordMigration = database.query(`
      INSERT INTO schema_migrations (version, applied_at)
      VALUES ($version, $appliedAt);
    `);
    const applyMigration = database.transaction((version: string, sql: string) => {
      database.run(sql);
      recordMigration.run({ version, appliedAt: new Date().toISOString() });
    });

    for (const migrationFile of migrationFiles) {
      if (appliedMigrations.has(migrationFile)) {
        console.log(`Skipping ${migrationFile} (already applied)`);
        continue;
      }

      const sql = await readFile(resolve(migrationsDirectory, migrationFile), "utf8");

      try {
        applyMigration.immediate(migrationFile, sql);
        console.log(`Applied ${migrationFile}`);
      } catch (error) {
        throw new Error(`Failed to apply migration ${migrationFile}`, { cause: error });
      }
    }
  } finally {
    database.close(true);
  }
}

try {
  await migrate();
} catch (error) {
  console.error(error instanceof Error ? error.message : "Migration failed");
  process.exitCode = 1;
}
