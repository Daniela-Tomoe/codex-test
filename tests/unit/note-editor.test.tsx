import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EMPTY_NOTE_CONTENT, type OwnedNote } from "@/src/lib/note-contracts";

const mocks = vi.hoisted(() => ({
  clearContent: vi.fn(),
  createNoteAction: vi.fn(),
  editorOptions: null as unknown,
  focus: vi.fn(),
  getJSON: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
  run: vi.fn(),
  setEditable: vi.fn(),
  updateNoteAction: vi.fn(),
}));

const mockChain = {
  focus: mocks.focus,
  run: mocks.run,
};

const mockEditor = {
  chain: vi.fn(() => mockChain),
  commands: {
    clearContent: mocks.clearContent,
    focus: mocks.focus,
  },
  getJSON: mocks.getJSON,
  setEditable: mocks.setEditable,
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh, replace: mocks.replace }),
}));
vi.mock("@/app/(notes)/notes/actions", () => ({
  createNoteAction: mocks.createNoteAction,
  updateNoteAction: mocks.updateNoteAction,
}));
vi.mock("@/src/components/editor-toolbar", () => ({
  EditorToolbar: () => null,
}));
vi.mock("@tiptap/starter-kit", () => ({
  default: { configure: vi.fn(() => ({})) },
}));
vi.mock("@tiptap/react", () => ({
  EditorContent: () => null,
  useEditor: (options: unknown) => {
    mocks.editorOptions = options;
    return mockEditor;
  },
}));

import { NoteEditor } from "@/src/components/note-editor";

type EditorOptions = {
  onUpdate: (input: { editor: typeof mockEditor }) => void;
};

const existingNote: OwnedNote = {
  contentJson: EMPTY_NOTE_CONTENT,
  createdAt: "2026-08-11T09:00:00.000Z",
  id: "note-1",
  title: "Original",
  updatedAt: "2026-08-11T10:00:00.000Z",
};

function updateEditorContent(contentJson: object) {
  mocks.getJSON.mockReturnValue(contentJson);
  const options = mocks.editorOptions as EditorOptions;
  act(() => {
    options.onUpdate({ editor: mockEditor });
  });
}

async function advanceAutosave() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1_000);
  });
}

describe("NoteEditor", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.clearContent.mockReset();
    mocks.createNoteAction.mockReset();
    mocks.focus.mockReset();
    mocks.getJSON.mockReset();
    mocks.refresh.mockReset();
    mocks.replace.mockReset();
    mocks.run.mockReset();
    mocks.setEditable.mockReset();
    mocks.updateNoteAction.mockReset();
    mocks.getJSON.mockReturnValue(EMPTY_NOTE_CONTENT);
    mocks.focus.mockReturnValue(mockChain);
    mocks.run.mockReturnValue(true);
    mocks.createNoteAction.mockResolvedValue({
      data: { id: "created-note", updatedAt: "2026-08-11T11:00:00.000Z" },
    });
    mocks.updateNoteAction.mockResolvedValue({
      data: { updatedAt: "2026-08-11T11:00:00.000Z" },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates the current draft and navigates to the persisted note", async () => {
    render(<NoteEditor mode="create" />);
    fireEvent.change(screen.getByLabelText("Note title"), { target: { value: "New note" } });
    const contentJson = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Body" }] }],
    };
    updateEditorContent(contentJson);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Create note" }));
    });

    expect(mocks.createNoteAction).toHaveBeenCalledWith({ contentJson, title: "New note" });
    expect(mocks.setEditable).toHaveBeenCalledWith(false);
    expect(mocks.replace).toHaveBeenCalledWith("/notes/created-note");
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it.each(["result", "throw"])("restores editing after a create %s failure", async (kind) => {
    if (kind === "result") {
      mocks.createNoteAction.mockResolvedValue({
        error: { code: "VALIDATION_ERROR", message: "The note could not be created." },
      });
    } else {
      mocks.createNoteAction.mockRejectedValue(new Error("network detail"));
    }
    render(<NoteEditor mode="create" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Create note" }));
    });

    expect(screen.getByRole("status").textContent).toBe("Couldn’t save");
    expect(screen.getByRole("alert").textContent).toBe(
      kind === "result"
        ? "The note could not be created."
        : "Unable to create this note. Please try again.",
    );
    expect(mocks.setEditable).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole("button", { name: "Create note" })).toHaveProperty("disabled", false);
  });

  it("debounces edits and persists the latest draft", async () => {
    render(<NoteEditor mode="edit" note={existingNote} />);
    fireEvent.change(screen.getByLabelText("Note title"), { target: { value: "Changed" } });

    expect(screen.getByRole("status").textContent).toBe("Unsaved changes");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(999);
    });
    expect(mocks.updateNoteAction).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(mocks.updateNoteAction).toHaveBeenCalledWith({
      contentJson: EMPTY_NOTE_CONTENT,
      id: "note-1",
      title: "Changed",
    });
    expect(screen.getByRole("status").textContent).toBe("Saved");
  });

  it("does not save a draft that matches the last persisted snapshot", async () => {
    render(<NoteEditor mode="edit" note={existingNote} />);
    fireEvent.change(screen.getByLabelText("Note title"), { target: { value: "Original" } });

    await advanceAutosave();

    expect(mocks.updateNoteAction).not.toHaveBeenCalled();
    expect(screen.getByRole("status").textContent).toBe("Saved");
  });

  it("immediately follows an in-flight save with the newest draft", async () => {
    let resolveFirstSave: ((value: { data: { updatedAt: string } }) => void) | undefined;
    mocks.updateNoteAction
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirstSave = resolve;
          }),
      )
      .mockResolvedValueOnce({ data: { updatedAt: "2026-08-11T12:00:00.000Z" } });
    render(<NoteEditor mode="edit" note={existingNote} />);
    fireEvent.change(screen.getByLabelText("Note title"), { target: { value: "First" } });
    await advanceAutosave();
    expect(mocks.updateNoteAction).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByLabelText("Note title"), { target: { value: "Latest" } });
    await act(async () => {
      resolveFirstSave?.({ data: { updatedAt: "2026-08-11T11:00:00.000Z" } });
      await Promise.resolve();
    });

    expect(mocks.updateNoteAction).toHaveBeenCalledTimes(2);
    expect(mocks.updateNoteAction).toHaveBeenLastCalledWith({
      contentJson: EMPTY_NOTE_CONTENT,
      id: "note-1",
      title: "Latest",
    });
    expect(screen.getByRole("status").textContent).toBe("Saved");
  });

  it("shows an autosave error and retries manually", async () => {
    mocks.updateNoteAction
      .mockResolvedValueOnce({
        error: { code: "INTERNAL_ERROR", message: "Unable to save this note. Please try again." },
      })
      .mockResolvedValueOnce({ data: { updatedAt: "2026-08-11T12:00:00.000Z" } });
    render(<NoteEditor mode="edit" note={existingNote} />);
    fireEvent.change(screen.getByLabelText("Note title"), { target: { value: "Changed" } });

    await advanceAutosave();

    expect(screen.getByRole("alert").textContent).toBe(
      "Unable to save this note. Please try again.",
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save now" }));
    });
    expect(mocks.updateNoteAction).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("status").textContent).toBe("Saved");
  });

  it("requires confirmation before clearing content", () => {
    render(<NoteEditor mode="edit" note={existingNote} />);

    fireEvent.click(screen.getByRole("button", { name: "Clear content" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mocks.clearContent).not.toHaveBeenCalled();
    expect(mocks.focus).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Clear content" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm clear" }));
    expect(mocks.clearContent).toHaveBeenCalledOnce();
    expect(screen.queryByRole("button", { name: "Confirm clear" })).toBeNull();
  });

  it("warns before unloading only while changes are unsaved", () => {
    render(<NoteEditor mode="edit" note={existingNote} />);
    const savedEvent = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(savedEvent);
    expect(savedEvent.defaultPrevented).toBe(false);

    fireEvent.change(screen.getByLabelText("Note title"), { target: { value: "Changed" } });
    const unsavedEvent = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(unsavedEvent);
    expect(unsavedEvent.defaultPrevented).toBe(true);
  });

  it("cancels a pending autosave when unmounted", async () => {
    const view = render(<NoteEditor mode="edit" note={existingNote} />);
    fireEvent.change(screen.getByLabelText("Note title"), { target: { value: "Changed" } });

    view.unmount();
    await advanceAutosave();

    expect(mocks.updateNoteAction).not.toHaveBeenCalled();
  });
});
