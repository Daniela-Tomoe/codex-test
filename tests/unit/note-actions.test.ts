import { beforeEach, describe, expect, it, vi } from "vitest";

import { EMPTY_NOTE_CONTENT } from "@/src/lib/note-contracts";

const mocks = vi.hoisted(() => ({
  createOwnedNote: vi.fn(),
  getSession: vi.fn(),
  revalidatePath: vi.fn(),
  updateOwnedNote: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/src/lib/auth-session", () => ({ getSession: mocks.getSession }));
vi.mock("@/src/lib/notes", () => ({
  createOwnedNote: mocks.createOwnedNote,
  updateOwnedNote: mocks.updateOwnedNote,
}));

import { createNoteAction, updateNoteAction } from "@/app/(notes)/notes/actions";

const session = {
  session: { id: "session-1" },
  user: { email: "owner@example.com", id: "user-1", name: "Owner" },
};

describe("note server actions", () => {
  beforeEach(() => {
    mocks.createOwnedNote.mockReset();
    mocks.getSession.mockReset();
    mocks.revalidatePath.mockReset();
    mocks.updateOwnedNote.mockReset();
    mocks.getSession.mockResolvedValue(session);
  });

  describe("createNoteAction", () => {
    it("rejects unauthenticated callers without touching the data layer", async () => {
      mocks.getSession.mockResolvedValue(null);

      await expect(
        createNoteAction({ contentJson: EMPTY_NOTE_CONTENT, title: "Private" }),
      ).resolves.toEqual({
        error: { code: "UNAUTHORIZED", message: "Log in to create a note." },
      });
      expect(mocks.createOwnedNote).not.toHaveBeenCalled();
    });

    it("validates input before creating a note", async () => {
      const result = await createNoteAction({
        contentJson: { type: "image" },
        title: "a".repeat(201),
      });

      expect(result).toEqual({
        error: { code: "VALIDATION_ERROR", message: "Keep the title under 200 characters." },
      });
      expect(mocks.createOwnedNote).not.toHaveBeenCalled();
    });

    it("serializes valid content, scopes the write to the user, and revalidates the list", async () => {
      mocks.createOwnedNote.mockReturnValue({
        id: "note-1",
        updatedAt: "2026-08-11T10:00:00.000Z",
      });

      const result = await createNoteAction({
        contentJson: EMPTY_NOTE_CONTENT,
        title: "A note",
      });

      expect(result).toEqual({
        data: { id: "note-1", updatedAt: "2026-08-11T10:00:00.000Z" },
      });
      expect(mocks.createOwnedNote).toHaveBeenCalledWith({
        contentJson: JSON.stringify(EMPTY_NOTE_CONTENT),
        title: "A note",
        userId: "user-1",
      });
      expect(mocks.revalidatePath).toHaveBeenCalledOnce();
      expect(mocks.revalidatePath).toHaveBeenCalledWith("/notes");
    });

    it("logs internal details but returns a generic error", async () => {
      const databaseError = new Error("SQLITE_CONSTRAINT secret detail");
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
      mocks.createOwnedNote.mockImplementation(() => {
        throw databaseError;
      });

      await expect(
        createNoteAction({ contentJson: EMPTY_NOTE_CONTENT, title: "A note" }),
      ).resolves.toEqual({
        error: {
          code: "INTERNAL_ERROR",
          message: "Unable to save this note. Please try again.",
        },
      });
      expect(consoleError).toHaveBeenCalledWith("Failed to create note", databaseError);
    });
  });

  describe("updateNoteAction", () => {
    it("rejects unauthenticated callers", async () => {
      mocks.getSession.mockResolvedValue(null);

      await expect(updateNoteAction({ id: "note-1", title: "Changed" })).resolves.toEqual({
        error: { code: "UNAUTHORIZED", message: "Log in to save this note." },
      });
      expect(mocks.updateOwnedNote).not.toHaveBeenCalled();
    });

    it("rejects missing IDs and empty updates", async () => {
      await expect(updateNoteAction({ id: "", title: "Changed" })).resolves.toEqual({
        error: { code: "NOT_FOUND", message: "This note could not be found." },
      });
      await expect(updateNoteAction({ id: "note-1" })).resolves.toEqual({
        error: {
          code: "VALIDATION_ERROR",
          message: "There are no note changes to save.",
        },
      });
      expect(mocks.updateOwnedNote).not.toHaveBeenCalled();
    });

    it("validates each supplied field", async () => {
      await expect(updateNoteAction({ id: "note-1", title: 42 as never })).resolves.toEqual({
        error: { code: "VALIDATION_ERROR", message: "Enter a valid note title." },
      });
      await expect(
        updateNoteAction({ contentJson: { type: "video" }, id: "note-1" }),
      ).resolves.toEqual({
        error: {
          code: "VALIDATION_ERROR",
          message: "The note contains unsupported content.",
        },
      });
    });

    it("supports partial updates without revalidating routes during autosave", async () => {
      mocks.updateOwnedNote.mockReturnValue({ updatedAt: "2026-08-11T11:00:00.000Z" });

      const result = await updateNoteAction({ id: "note-1", title: "Changed" });

      expect(result).toEqual({ data: { updatedAt: "2026-08-11T11:00:00.000Z" } });
      expect(mocks.updateOwnedNote).toHaveBeenCalledWith({
        contentJson: undefined,
        id: "note-1",
        title: "Changed",
        userId: "user-1",
      });
      expect(mocks.revalidatePath).not.toHaveBeenCalled();
    });

    it("serializes content updates", async () => {
      mocks.updateOwnedNote.mockReturnValue({ updatedAt: "2026-08-11T11:00:00.000Z" });

      await updateNoteAction({ contentJson: EMPTY_NOTE_CONTENT, id: "note-1" });

      expect(mocks.updateOwnedNote).toHaveBeenCalledWith({
        contentJson: JSON.stringify(EMPTY_NOTE_CONTENT),
        id: "note-1",
        title: undefined,
        userId: "user-1",
      });
    });

    it("does not reveal whether a missing note belongs to another user", async () => {
      mocks.updateOwnedNote.mockReturnValue(null);

      await expect(
        updateNoteAction({ id: "another-user-note", title: "Changed" }),
      ).resolves.toEqual({
        error: { code: "NOT_FOUND", message: "This note could not be found." },
      });
    });

    it("returns a generic error when persistence fails", async () => {
      const databaseError = new Error("database path and SQL details");
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
      mocks.updateOwnedNote.mockImplementation(() => {
        throw databaseError;
      });

      await expect(updateNoteAction({ id: "note-1", title: "Changed" })).resolves.toEqual({
        error: {
          code: "INTERNAL_ERROR",
          message: "Unable to save this note. Please try again.",
        },
      });
      expect(consoleError).toHaveBeenCalledWith("Failed to update note", databaseError);
    });
  });
});
