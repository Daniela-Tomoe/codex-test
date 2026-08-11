"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/src/lib/auth-session";
import type { CreateNoteInput, NoteActionResult, UpdateNoteInput } from "@/src/lib/note-contracts";
import { createOwnedNote, updateOwnedNote } from "@/src/lib/notes";
import { validateNoteContent, validateNoteTitle } from "@/src/lib/note-validation";

const genericErrorMessage = "Unable to save this note. Please try again.";

function validationError(message: string) {
  return {
    error: {
      code: "VALIDATION_ERROR" as const,
      message,
    },
  };
}

export async function createNoteAction(
  input: CreateNoteInput,
): Promise<NoteActionResult<{ id: string; updatedAt: string }>> {
  const session = await getSession();

  if (!session) {
    return { error: { code: "UNAUTHORIZED", message: "Log in to create a note." } };
  }

  const title = validateNoteTitle(input?.title);

  if (!title.ok) {
    return validationError(title.error);
  }

  const content = validateNoteContent(input?.contentJson);

  if (!content.ok) {
    return validationError(content.error);
  }

  try {
    const note = createOwnedNote({
      contentJson: content.value.serializedContent,
      title: title.value,
      userId: session.user.id,
    });

    revalidatePath("/notes");
    return { data: note };
  } catch (error) {
    console.error("Failed to create note", error);
    return { error: { code: "INTERNAL_ERROR", message: genericErrorMessage } };
  }
}

export async function updateNoteAction(
  input: UpdateNoteInput,
): Promise<NoteActionResult<{ updatedAt: string }>> {
  const session = await getSession();

  if (!session) {
    return { error: { code: "UNAUTHORIZED", message: "Log in to save this note." } };
  }

  if (!input || typeof input.id !== "string" || !input.id) {
    return { error: { code: "NOT_FOUND", message: "This note could not be found." } };
  }

  if (input.title === undefined && input.contentJson === undefined) {
    return validationError("There are no note changes to save.");
  }

  const title = input.title === undefined ? undefined : validateNoteTitle(input.title);

  if (title && !title.ok) {
    return validationError(title.error);
  }

  const content =
    input.contentJson === undefined ? undefined : validateNoteContent(input.contentJson);

  if (content && !content.ok) {
    return validationError(content.error);
  }

  try {
    const note = updateOwnedNote({
      contentJson: content?.ok ? content.value.serializedContent : undefined,
      id: input.id,
      title: title?.ok ? title.value : undefined,
      userId: session.user.id,
    });

    if (!note) {
      return { error: { code: "NOT_FOUND", message: "This note could not be found." } };
    }

    return { data: note };
  } catch (error) {
    console.error("Failed to update note", error);
    return { error: { code: "INTERNAL_ERROR", message: genericErrorMessage } };
  }
}
