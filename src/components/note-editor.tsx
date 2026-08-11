"use client";

import { EditorContent, type JSONContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useEffect, useRef, useState } from "react";

import { createNoteAction, updateNoteAction } from "@/app/(notes)/notes/actions";
import { EditorToolbar } from "@/src/components/editor-toolbar";
import {
  EMPTY_NOTE_CONTENT,
  MAX_NOTE_TITLE_LENGTH,
  type OwnedNote,
} from "@/src/lib/note-contracts";

const autosaveDelayMilliseconds = 10_000;

type SaveStatus = "error" | "idle" | "saved" | "saving" | "unsaved";

type NoteEditorProps = { mode: "create"; note?: never } | { mode: "edit"; note: OwnedNote };

type DraftSnapshot = {
  contentJson: JSONContent;
  serialized: string;
  title: string;
};

const saveStatusCopy: Record<SaveStatus, string> = {
  error: "Couldn’t save",
  idle: "New note",
  saved: "Saved",
  saving: "Saving…",
  unsaved: "Unsaved changes",
};

function createDraftSnapshot(title: string, contentJson: JSONContent): DraftSnapshot {
  return {
    contentJson,
    serialized: JSON.stringify({ contentJson, title }),
    title,
  };
}

function isAllowedHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

function statusClassName(status: SaveStatus): string {
  if (status === "error") {
    return "bg-red-50 text-red-800";
  }

  if (status === "saved") {
    return "bg-emerald-50 text-emerald-800";
  }

  if (status === "saving") {
    return "bg-cyan-50 text-cyan-800";
  }

  return "bg-amber-50 text-amber-800";
}

export function NoteEditor(props: NoteEditorProps) {
  const router = useRouter();
  const initialTitle = props.mode === "edit" ? props.note.title : "";
  const initialContent = props.mode === "edit" ? props.note.contentJson : EMPTY_NOTE_CONTENT;
  const initialSnapshotRef = useRef(createDraftSnapshot(initialTitle, initialContent));
  const [title, setTitle] = useState(initialTitle);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(
    props.mode === "edit" ? "saved" : "idle",
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const titleRef = useRef(initialTitle);
  const contentRef = useRef(initialContent);
  const lastSavedSnapshotRef = useRef(initialSnapshotRef.current.serialized);
  const currentSnapshotRef = useRef(initialSnapshotRef.current.serialized);
  const hasUnsavedChangesRef = useRef(false);
  const saveInFlightRef = useRef(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const noteId = props.mode === "edit" ? props.note.id : null;

  function clearAutosaveTimer() {
    if (autosaveTimerRef.current !== null) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
  }

  function currentDraftSnapshot(): DraftSnapshot {
    return createDraftSnapshot(titleRef.current, contentRef.current);
  }

  function scheduleAutosave() {
    if (props.mode !== "edit") {
      return;
    }

    clearAutosaveTimer();
    autosaveTimerRef.current = setTimeout(() => {
      void persistLatestDraft();
    }, autosaveDelayMilliseconds);
  }

  function synchronizeDraft(nextTitle: string, nextContent: JSONContent) {
    const snapshot = createDraftSnapshot(nextTitle, nextContent);
    currentSnapshotRef.current = snapshot.serialized;
    const hasChanges = snapshot.serialized !== lastSavedSnapshotRef.current;
    hasUnsavedChangesRef.current = hasChanges;

    if (!hasChanges) {
      clearAutosaveTimer();

      if (!saveInFlightRef.current && isMountedRef.current) {
        setSaveStatus(props.mode === "edit" ? "saved" : "idle");
        setSaveError(null);
      }

      return;
    }

    if (!saveInFlightRef.current && isMountedRef.current) {
      setSaveStatus("unsaved");
      setSaveError(null);
    }

    scheduleAutosave();
  }

  async function persistLatestDraft(): Promise<boolean> {
    if (props.mode !== "edit" || !noteId) {
      return false;
    }

    clearAutosaveTimer();

    if (saveInFlightRef.current) {
      return false;
    }

    const snapshot = currentDraftSnapshot();

    if (snapshot.serialized === lastSavedSnapshotRef.current) {
      hasUnsavedChangesRef.current = false;

      if (isMountedRef.current) {
        setSaveStatus("saved");
        setSaveError(null);
      }

      return true;
    }

    saveInFlightRef.current = true;

    if (isMountedRef.current) {
      setSaveStatus("saving");
      setSaveError(null);
    }

    try {
      const result = await updateNoteAction({
        contentJson: snapshot.contentJson,
        id: noteId,
        title: snapshot.title,
      });

      saveInFlightRef.current = false;

      if (!isMountedRef.current) {
        return !result.error;
      }

      if (result.error) {
        hasUnsavedChangesRef.current = true;
        setSaveStatus("error");
        setSaveError(result.error.message);
        return false;
      }

      lastSavedSnapshotRef.current = snapshot.serialized;

      if (currentSnapshotRef.current !== snapshot.serialized) {
        hasUnsavedChangesRef.current = true;
        setSaveStatus("saving");
        return persistLatestDraft();
      }

      hasUnsavedChangesRef.current = false;
      setSaveStatus("saved");
      setSaveError(null);
      return true;
    } catch {
      saveInFlightRef.current = false;

      if (isMountedRef.current) {
        hasUnsavedChangesRef.current = true;
        setSaveStatus("error");
        setSaveError("Unable to save this note. Please try again.");
      }

      return false;
    }
  }

  function handleEditorUpdate(contentJson: JSONContent) {
    contentRef.current = contentJson;
    synchronizeDraft(titleRef.current, contentJson);
  }

  const editor = useEditor(
    {
      content: initialContent,
      editorProps: {
        attributes: {
          "aria-label": "Note content",
          "aria-multiline": "true",
          class: "tiptap",
          role: "textbox",
        },
      },
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
          link: {
            HTMLAttributes: {
              rel: "noopener noreferrer",
              target: "_blank",
            },
            isAllowedUri: isAllowedHttpUrl,
            openOnClick: false,
            shouldAutoLink: isAllowedHttpUrl,
          },
        }),
      ],
      immediatelyRender: false,
      onUpdate: ({ editor: currentEditor }) => {
        handleEditorUpdate(currentEditor.getJSON());
      },
    },
    [noteId],
  );

  useEffect(() => {
    isMountedRef.current = true;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!hasUnsavedChangesRef.current) {
        return;
      }

      event.preventDefault();
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      isMountedRef.current = false;
      clearAutosaveTimer();
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  function handleTitleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextTitle = event.currentTarget.value;
    titleRef.current = nextTitle;
    setTitle(nextTitle);
    synchronizeDraft(nextTitle, contentRef.current);
  }

  async function handleCreateNote() {
    if (props.mode !== "create" || !editor || isCreating) {
      return;
    }

    const snapshot = currentDraftSnapshot();
    setIsCreating(true);
    setSaveStatus("saving");
    setSaveError(null);
    editor.setEditable(false);

    try {
      const result = await createNoteAction({
        contentJson: snapshot.contentJson,
        title: snapshot.title,
      });

      if (result.error) {
        setSaveStatus("error");
        setSaveError(result.error.message);
        setIsCreating(false);
        editor.setEditable(true);
        return;
      }

      lastSavedSnapshotRef.current = snapshot.serialized;
      hasUnsavedChangesRef.current = false;
      setSaveStatus("saved");
      router.replace(`/notes/${result.data.id}`);
      router.refresh();
    } catch {
      setSaveStatus("error");
      setSaveError("Unable to create this note. Please try again.");
      setIsCreating(false);
      editor.setEditable(true);
    }
  }

  function handleSaveNow() {
    if (props.mode === "create") {
      void handleCreateNote();
      return;
    }

    void persistLatestDraft();
  }

  function handleRequestClear() {
    setIsConfirmingClear(true);
  }

  function handleCancelClear() {
    setIsConfirmingClear(false);
    editor?.chain().focus().run();
  }

  function handleConfirmClear() {
    if (!editor) {
      return;
    }

    editor.commands.clearContent();
    handleEditorUpdate(editor.getJSON());
    setIsConfirmingClear(false);
    editor.commands.focus();
  }

  const saveButtonDisabled =
    !editor ||
    isCreating ||
    (props.mode === "edit" && saveStatus !== "unsaved" && saveStatus !== "error");
  const saveButtonLabel =
    props.mode === "create" ? (isCreating ? "Creating…" : "Create note") : "Save now";

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/notes"
          className="inline-flex items-center gap-2 text-sm font-semibold text-teal-800 transition-colors hover:text-teal-950"
        >
          <span aria-hidden="true">←</span>
          All notes
        </Link>

        <div className="flex items-center gap-3">
          <p
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusClassName(saveStatus)}`}
            role="status"
            aria-live="polite"
          >
            {saveStatusCopy[saveStatus]}
          </p>
          <button
            type="button"
            disabled={saveButtonDisabled}
            onClick={handleSaveNow}
            className="rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {saveButtonLabel}
          </button>
        </div>
      </div>

      <section className="overflow-hidden rounded-3xl border border-teal-950/10 bg-white shadow-[0_30px_90px_-45px_rgba(15,118,110,0.45)]">
        <div className="border-b border-teal-950/10 px-5 py-5 sm:px-7">
          <label htmlFor="note-title" className="sr-only">
            Note title
          </label>
          <input
            id="note-title"
            type="text"
            autoComplete="off"
            disabled={isCreating}
            maxLength={MAX_NOTE_TITLE_LENGTH}
            onChange={handleTitleChange}
            placeholder="Untitled note"
            value={title}
            className="w-full bg-transparent text-2xl font-bold tracking-tight text-slate-950 outline-none placeholder:text-slate-300 sm:text-3xl"
          />
          <p className="mt-2 text-xs text-slate-400">
            {title.length}/{MAX_NOTE_TITLE_LENGTH} characters
          </p>
        </div>

        {editor ? <EditorToolbar disabled={isCreating} editor={editor} /> : null}

        <div className="min-h-80 bg-white focus-within:ring-4 focus-within:ring-inset focus-within:ring-teal-600/10 sm:min-h-112">
          <EditorContent editor={editor} />
        </div>

        <footer className="flex flex-col gap-3 border-t border-teal-950/10 bg-slate-50/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            {isConfirmingClear ? (
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-slate-700">Clear the note body?</p>
                <button
                  type="button"
                  onClick={handleConfirmClear}
                  className="rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-800"
                >
                  Confirm clear
                </button>
                <button
                  type="button"
                  onClick={handleCancelClear}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-200"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={!editor || isCreating}
                onClick={handleRequestClear}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Clear content
              </button>
            )}
          </div>

          <p className="text-xs leading-5 text-slate-500">
            {props.mode === "edit"
              ? "Changes save automatically after 10 seconds of inactivity."
              : "Create the note when your first draft is ready."}
          </p>
        </footer>
      </section>

      {saveError ? (
        <p
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
          role="alert"
        >
          {saveError}
        </p>
      ) : null}
    </main>
  );
}
