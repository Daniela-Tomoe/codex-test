import type { Metadata } from "next";

import { NoteEditor } from "@/src/components/note-editor";
import { requireSession } from "@/src/lib/auth-session";

export const metadata: Metadata = {
  title: "New note | TinyNotes",
};

export default async function NewNotePage() {
  await requireSession();

  return <NoteEditor mode="create" />;
}
