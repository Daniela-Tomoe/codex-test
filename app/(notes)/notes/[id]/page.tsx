import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { NoteEditor } from "@/src/components/note-editor";
import { requireSession } from "@/src/lib/auth-session";
import { getOwnedNote } from "@/src/lib/notes";

export const metadata: Metadata = {
  title: "Edit note | TinyNotes",
};

export default async function NotePage({ params }: PageProps<"/notes/[id]">) {
  const [{ id }, session] = await Promise.all([params, requireSession()]);
  const note = getOwnedNote(id, session.user.id);

  if (!note) {
    notFound();
  }

  return <NoteEditor key={note.id} mode="edit" note={note} />;
}
