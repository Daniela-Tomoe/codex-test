import "server-only";

import { database } from "@/src/lib/database";
import type { NoteSummary, OwnedNote } from "@/src/lib/note-contracts";
import { validateNoteContent } from "@/src/lib/note-validation";

type NoteSummaryRow = {
  created_at: string;
  id: string;
  title: string;
  updated_at: string;
};

type OwnedNoteRow = NoteSummaryRow & {
  content_json: string;
};

type CreateOwnedNoteInput = {
  contentJson: string;
  title: string;
  userId: string;
};

type UpdateOwnedNoteInput = {
  contentJson?: string;
  id: string;
  title?: string;
  userId: string;
};

function mapNoteSummary(row: NoteSummaryRow): NoteSummary {
  return {
    createdAt: row.created_at,
    id: row.id,
    title: row.title,
    updatedAt: row.updated_at,
  };
}

export function listOwnedNotes(userId: string): NoteSummary[] {
  const rows = database
    .query<NoteSummaryRow, [string]>(`
      SELECT id, title, created_at, updated_at
      FROM note
      WHERE user_id = ?
      ORDER BY updated_at DESC;
    `)
    .all(userId);

  return rows.map(mapNoteSummary);
}

export function getOwnedNote(id: string, userId: string): OwnedNote | null {
  const row = database
    .query<OwnedNoteRow, [string, string]>(`
      SELECT id, title, content_json, created_at, updated_at
      FROM note
      WHERE id = ? AND user_id = ?
      LIMIT 1;
    `)
    .get(id, userId);

  if (!row) {
    return null;
  }

  let storedContent: unknown;

  try {
    storedContent = JSON.parse(row.content_json) as unknown;
  } catch {
    throw new Error(`Stored content for note ${row.id} is not valid JSON.`);
  }

  const validatedContent = validateNoteContent(storedContent);

  if (!validatedContent.ok) {
    throw new Error(`Stored content for note ${row.id} is not valid TipTap JSON.`);
  }

  return {
    ...mapNoteSummary(row),
    contentJson: validatedContent.value.contentJson,
  };
}

export function createOwnedNote(input: CreateOwnedNoteInput): { id: string; updatedAt: string } {
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  database
    .query<never, [string, string, string, string, string, string]>(`
      INSERT INTO note (id, user_id, title, content_json, share_enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, 0, ?, ?);
    `)
    .run(id, input.userId, input.title, input.contentJson, timestamp, timestamp);

  return { id, updatedAt: timestamp };
}

export function updateOwnedNote(input: UpdateOwnedNoteInput): { updatedAt: string } | null {
  const timestamp = new Date().toISOString();
  const result = database
    .query<never, [string | null, string | null, string, string, string]>(`
      UPDATE note
      SET title = COALESCE(?, title),
          content_json = COALESCE(?, content_json),
          updated_at = ?
      WHERE id = ? AND user_id = ?;
    `)
    .run(input.title ?? null, input.contentJson ?? null, timestamp, input.id, input.userId);

  return result.changes === 0 ? null : { updatedAt: timestamp };
}
