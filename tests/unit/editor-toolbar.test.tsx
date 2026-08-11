import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EditorToolbar } from "@/src/components/editor-toolbar";

const mocks = vi.hoisted(() => ({
  toolbarState: {
    canRedo: false,
    canUndo: false,
    isBlockquote: false,
    isBold: false,
    isBulletList: false,
    isCode: false,
    isCodeBlock: false,
    isHeading1: false,
    isHeading2: false,
    isHeading3: false,
    isItalic: false,
    isLink: false,
    isOrderedList: false,
    isParagraph: true,
    isStrike: false,
    isUnderline: false,
  },
  useEditorState: vi.fn(),
}));

vi.mock("@tiptap/react", () => ({
  useEditorState: mocks.useEditorState,
}));

import { EditorToolbar as Toolbar } from "@/src/components/editor-toolbar";

type Editor = Parameters<typeof EditorToolbar>[0]["editor"];

function createEditor() {
  const chain = {
    extendMarkRange: vi.fn(),
    focus: vi.fn(),
    redo: vi.fn(),
    run: vi.fn(() => true),
    setHorizontalRule: vi.fn(),
    setLink: vi.fn(),
    setParagraph: vi.fn(),
    toggleBlockquote: vi.fn(),
    toggleBold: vi.fn(),
    toggleBulletList: vi.fn(),
    toggleCode: vi.fn(),
    toggleCodeBlock: vi.fn(),
    toggleHeading: vi.fn(),
    toggleItalic: vi.fn(),
    toggleOrderedList: vi.fn(),
    toggleStrike: vi.fn(),
    toggleUnderline: vi.fn(),
    undo: vi.fn(),
    unsetLink: vi.fn(),
  };

  chain.extendMarkRange.mockReturnValue(chain);
  chain.focus.mockReturnValue(chain);
  chain.redo.mockReturnValue(chain);
  chain.setHorizontalRule.mockReturnValue(chain);
  chain.setLink.mockReturnValue(chain);
  chain.setParagraph.mockReturnValue(chain);
  chain.toggleBlockquote.mockReturnValue(chain);
  chain.toggleBold.mockReturnValue(chain);
  chain.toggleBulletList.mockReturnValue(chain);
  chain.toggleCode.mockReturnValue(chain);
  chain.toggleCodeBlock.mockReturnValue(chain);
  chain.toggleHeading.mockReturnValue(chain);
  chain.toggleItalic.mockReturnValue(chain);
  chain.toggleOrderedList.mockReturnValue(chain);
  chain.toggleStrike.mockReturnValue(chain);
  chain.toggleUnderline.mockReturnValue(chain);
  chain.undo.mockReturnValue(chain);
  chain.unsetLink.mockReturnValue(chain);

  const editor = {
    chain: vi.fn(() => chain),
    getAttributes: vi.fn(() => ({})),
  } as unknown as Editor;

  return { chain, editor };
}

describe("EditorToolbar", () => {
  beforeEach(() => {
    Object.assign(mocks.toolbarState, {
      canRedo: false,
      canUndo: false,
      isBlockquote: false,
      isBold: false,
      isBulletList: false,
      isCode: false,
      isCodeBlock: false,
      isHeading1: false,
      isHeading2: false,
      isHeading3: false,
      isItalic: false,
      isLink: false,
      isOrderedList: false,
      isParagraph: true,
      isStrike: false,
      isUnderline: false,
    });
    mocks.useEditorState.mockReset();
    mocks.useEditorState.mockReturnValue(mocks.toolbarState);
  });

  it("exposes accessible toolbar groups and active states", () => {
    mocks.toolbarState.isBold = true;
    const { editor } = createEditor();

    render(<Toolbar editor={editor} />);

    expect(screen.getByRole("toolbar", { name: "Text formatting" })).toBeDefined();
    expect(screen.getByRole("group", { name: "Inline formatting" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Bold" }).getAttribute("aria-pressed")).toBe("true");
    expect(
      screen.getByRole("button", { name: "Horizontal rule" }).getAttribute("aria-pressed"),
    ).toBeNull();
  });

  it.each([
    ["Paragraph", "setParagraph", undefined],
    ["Heading 1", "toggleHeading", { level: 1 }],
    ["Heading 2", "toggleHeading", { level: 2 }],
    ["Heading 3", "toggleHeading", { level: 3 }],
    ["Bold", "toggleBold", undefined],
    ["Italic", "toggleItalic", undefined],
    ["Underline", "toggleUnderline", undefined],
    ["Strikethrough", "toggleStrike", undefined],
    ["Inline code", "toggleCode", undefined],
    ["Bullet list", "toggleBulletList", undefined],
    ["Numbered list", "toggleOrderedList", undefined],
    ["Blockquote", "toggleBlockquote", undefined],
    ["Code block", "toggleCodeBlock", undefined],
    ["Horizontal rule", "setHorizontalRule", undefined],
  ] as const)("runs the %s command", (label, methodName, argument) => {
    const { chain, editor } = createEditor();
    render(<Toolbar editor={editor} />);

    fireEvent.click(screen.getByRole("button", { name: label }));

    const method = chain[methodName];
    if (argument) {
      expect(method).toHaveBeenCalledWith(argument);
    } else {
      expect(method).toHaveBeenCalledOnce();
    }
    expect(chain.focus).toHaveBeenCalled();
    expect(chain.run).toHaveBeenCalled();
  });

  it("enables undo and redo only when the editor can run them", () => {
    mocks.toolbarState.canUndo = true;
    mocks.toolbarState.canRedo = true;
    const { chain, editor } = createEditor();
    render(<Toolbar editor={editor} />);

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    fireEvent.click(screen.getByRole("button", { name: "Redo" }));

    expect(chain.undo).toHaveBeenCalledOnce();
    expect(chain.redo).toHaveBeenCalledOnce();
  });

  it("normalizes and applies an HTTP link", () => {
    const { chain, editor } = createEditor();
    render(<Toolbar editor={editor} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit link" }));
    fireEvent.change(screen.getByLabelText("Link address"), {
      target: { value: "example.com/docs" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Apply link" }));

    expect(chain.setLink).toHaveBeenCalledWith({
      href: "https://example.com/docs",
      rel: "noopener noreferrer",
      target: "_blank",
    });
    expect(screen.queryByLabelText("Link address")).toBeNull();
  });

  it.each(["javascript:alert(1)", "mailto:user@example.com", "https://u:p@example.com"])(
    "rejects unsafe link value %s",
    (value) => {
      const { chain, editor } = createEditor();
      render(<Toolbar editor={editor} />);
      fireEvent.click(screen.getByRole("button", { name: "Edit link" }));
      fireEvent.change(screen.getByLabelText("Link address"), { target: { value } });

      fireEvent.click(screen.getByRole("button", { name: "Apply link" }));

      expect(screen.getByRole("alert").textContent).toBe("Enter a valid HTTP or HTTPS address.");
      expect(chain.setLink).not.toHaveBeenCalled();
    },
  );

  it("loads, removes, and cancels editing an existing link", () => {
    mocks.toolbarState.isLink = true;
    const { chain, editor } = createEditor();
    vi.mocked(editor.getAttributes).mockReturnValue({ href: "https://example.com/current" });
    render(<Toolbar editor={editor} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit link" }));
    expect(screen.getByLabelText("Link address")).toHaveProperty(
      "value",
      "https://example.com/current",
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(chain.unsetLink).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: "Edit link" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(chain.focus).toHaveBeenCalled();
    expect(screen.queryByLabelText("Link address")).toBeNull();
  });

  it("disables editing commands when requested", () => {
    const { editor } = createEditor();
    render(<Toolbar disabled editor={editor} />);

    expect(screen.getByRole("button", { name: "Bold" })).toHaveProperty("disabled", true);
    expect(screen.getByRole("button", { name: "Edit link" })).toHaveProperty("disabled", true);
  });
});
