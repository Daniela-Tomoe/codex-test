import type { JSONContent } from "@tiptap/react";

export const MAX_NOTE_CONTENT_BYTES = 256 * 1024;
export const MAX_NOTE_TITLE_LENGTH = 200;

export const EMPTY_NOTE_CONTENT: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export type NoteSummary = {
  createdAt: string;
  id: string;
  title: string;
  updatedAt: string;
};

export type OwnedNote = NoteSummary & {
  contentJson: JSONContent;
};

export type NoteActionErrorCode =
  | "INTERNAL_ERROR"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "VALIDATION_ERROR";

export type NoteActionError = {
  code: NoteActionErrorCode;
  message: string;
};

export type NoteActionResult<T> =
  | { data: T; error?: never }
  | { data?: never; error: NoteActionError };

export type CreateNoteInput = {
  contentJson: JSONContent;
  title: string;
};

export type UpdateNoteInput = {
  contentJson?: JSONContent;
  id: string;
  title?: string;
};
