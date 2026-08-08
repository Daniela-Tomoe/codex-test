import "server-only";

import { Database } from "bun:sqlite";
import { resolve } from "node:path";

const configuredDatabasePath = process.env.DB_PATH?.trim() || "./data/tinynotes.db";
const databasePath =
  configuredDatabasePath === ":memory:"
    ? configuredDatabasePath
    : resolve(process.cwd(), configuredDatabasePath);

const globalDatabase = globalThis as typeof globalThis & {
  tinyNotesDatabase?: Database;
};

function openDatabase() {
  const database = new Database(databasePath, { create: true, strict: true });
  database.run("PRAGMA foreign_keys = ON;");
  return database;
}

export const database = globalDatabase.tinyNotesDatabase ?? openDatabase();

globalDatabase.tinyNotesDatabase = database;
