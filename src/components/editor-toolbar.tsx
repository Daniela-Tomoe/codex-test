"use client";

import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { type ChangeEvent, type FormEvent, useState } from "react";

type EditorToolbarProps = {
  disabled?: boolean;
  editor: Editor;
};

type ToolbarButtonProps = {
  active?: boolean;
  disabled?: boolean;
  label: string;
  onPress: () => void;
  text: string;
};

function toolbarButtonClassName(active: boolean | undefined): string {
  const baseClassName =
    "rounded-lg px-2.5 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-35";

  return active
    ? `${baseClassName} bg-teal-700 font-bold text-white shadow-sm`
    : `${baseClassName} font-semibold text-slate-600 hover:bg-teal-50 hover:text-teal-900`;
}

function ToolbarButton({ active, disabled, label, onPress, text }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active === undefined ? undefined : active}
      className={toolbarButtonClassName(active)}
      disabled={disabled}
      onClick={onPress}
      title={label}
    >
      {text}
    </button>
  );
}

function normalizeHttpUrl(value: string): string | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const valueWithProtocol = /^[a-z][a-z\d+.-]*:/i.test(trimmedValue)
    ? trimmedValue
    : `https://${trimmedValue}`;

  try {
    const url = new URL(valueWithProtocol);

    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      !url.hostname ||
      url.username ||
      url.password
    ) {
      return null;
    }

    return url.href;
  } catch {
    return null;
  }
}

export function EditorToolbar({ disabled = false, editor }: EditorToolbarProps) {
  const [isLinkEditorOpen, setIsLinkEditorOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const toolbarState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      canRedo: currentEditor.can().chain().focus().redo().run(),
      canUndo: currentEditor.can().chain().focus().undo().run(),
      isBlockquote: currentEditor.isActive("blockquote"),
      isBold: currentEditor.isActive("bold"),
      isBulletList: currentEditor.isActive("bulletList"),
      isCode: currentEditor.isActive("code"),
      isCodeBlock: currentEditor.isActive("codeBlock"),
      isHeading1: currentEditor.isActive("heading", { level: 1 }),
      isHeading2: currentEditor.isActive("heading", { level: 2 }),
      isHeading3: currentEditor.isActive("heading", { level: 3 }),
      isItalic: currentEditor.isActive("italic"),
      isLink: currentEditor.isActive("link"),
      isOrderedList: currentEditor.isActive("orderedList"),
      isParagraph: currentEditor.isActive("paragraph"),
      isStrike: currentEditor.isActive("strike"),
      isUnderline: currentEditor.isActive("underline"),
    }),
  });

  function handleParagraph() {
    editor.chain().focus().setParagraph().run();
  }

  function handleHeading1() {
    editor.chain().focus().toggleHeading({ level: 1 }).run();
  }

  function handleHeading2() {
    editor.chain().focus().toggleHeading({ level: 2 }).run();
  }

  function handleHeading3() {
    editor.chain().focus().toggleHeading({ level: 3 }).run();
  }

  function handleBold() {
    editor.chain().focus().toggleBold().run();
  }

  function handleItalic() {
    editor.chain().focus().toggleItalic().run();
  }

  function handleUnderline() {
    editor.chain().focus().toggleUnderline().run();
  }

  function handleStrike() {
    editor.chain().focus().toggleStrike().run();
  }

  function handleCode() {
    editor.chain().focus().toggleCode().run();
  }

  function handleBulletList() {
    editor.chain().focus().toggleBulletList().run();
  }

  function handleOrderedList() {
    editor.chain().focus().toggleOrderedList().run();
  }

  function handleBlockquote() {
    editor.chain().focus().toggleBlockquote().run();
  }

  function handleCodeBlock() {
    editor.chain().focus().toggleCodeBlock().run();
  }

  function handleHorizontalRule() {
    editor.chain().focus().setHorizontalRule().run();
  }

  function handleUndo() {
    editor.chain().focus().undo().run();
  }

  function handleRedo() {
    editor.chain().focus().redo().run();
  }

  function handleOpenLinkEditor() {
    const currentHref = editor.getAttributes("link").href;
    setLinkUrl(typeof currentHref === "string" ? currentHref : "");
    setLinkError(null);
    setIsLinkEditorOpen(true);
  }

  function handleCloseLinkEditor() {
    setIsLinkEditorOpen(false);
    setLinkError(null);
    editor.chain().focus().run();
  }

  function handleLinkUrlChange(event: ChangeEvent<HTMLInputElement>) {
    setLinkUrl(event.currentTarget.value);
    setLinkError(null);
  }

  function handleApplyLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedUrl = normalizeHttpUrl(linkUrl);

    if (!normalizedUrl) {
      setLinkError("Enter a valid HTTP or HTTPS address.");
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: normalizedUrl, rel: "noopener noreferrer", target: "_blank" })
      .run();
    setIsLinkEditorOpen(false);
    setLinkError(null);
  }

  function handleRemoveLink() {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setIsLinkEditorOpen(false);
    setLinkError(null);
  }

  return (
    <section aria-label="Editor tools" className="border-b border-teal-950/10 bg-teal-50/55">
      <div
        role="toolbar"
        aria-label="Text formatting"
        className="flex flex-wrap items-center gap-1.5 px-3 py-2.5 sm:px-4"
      >
        <div role="group" aria-label="Text style" className="flex items-center gap-1">
          <ToolbarButton
            active={toolbarState.isParagraph}
            disabled={disabled}
            label="Paragraph"
            onPress={handleParagraph}
            text="P"
          />
          <ToolbarButton
            active={toolbarState.isHeading1}
            disabled={disabled}
            label="Heading 1"
            onPress={handleHeading1}
            text="H1"
          />
          <ToolbarButton
            active={toolbarState.isHeading2}
            disabled={disabled}
            label="Heading 2"
            onPress={handleHeading2}
            text="H2"
          />
          <ToolbarButton
            active={toolbarState.isHeading3}
            disabled={disabled}
            label="Heading 3"
            onPress={handleHeading3}
            text="H3"
          />
        </div>

        <span aria-hidden="true" className="mx-0.5 h-6 w-px bg-teal-950/10" />

        <div role="group" aria-label="Inline formatting" className="flex items-center gap-1">
          <ToolbarButton
            active={toolbarState.isBold}
            disabled={disabled}
            label="Bold"
            onPress={handleBold}
            text="B"
          />
          <ToolbarButton
            active={toolbarState.isItalic}
            disabled={disabled}
            label="Italic"
            onPress={handleItalic}
            text="I"
          />
          <ToolbarButton
            active={toolbarState.isUnderline}
            disabled={disabled}
            label="Underline"
            onPress={handleUnderline}
            text="U"
          />
          <ToolbarButton
            active={toolbarState.isStrike}
            disabled={disabled}
            label="Strikethrough"
            onPress={handleStrike}
            text="S"
          />
          <ToolbarButton
            active={toolbarState.isCode}
            disabled={disabled}
            label="Inline code"
            onPress={handleCode}
            text="Code"
          />
        </div>

        <span aria-hidden="true" className="mx-0.5 h-6 w-px bg-teal-950/10" />

        <div role="group" aria-label="Blocks" className="flex flex-wrap items-center gap-1">
          <ToolbarButton
            active={toolbarState.isBulletList}
            disabled={disabled}
            label="Bullet list"
            onPress={handleBulletList}
            text="Bullets"
          />
          <ToolbarButton
            active={toolbarState.isOrderedList}
            disabled={disabled}
            label="Numbered list"
            onPress={handleOrderedList}
            text="Numbers"
          />
          <ToolbarButton
            active={toolbarState.isBlockquote}
            disabled={disabled}
            label="Blockquote"
            onPress={handleBlockquote}
            text="Quote"
          />
          <ToolbarButton
            active={toolbarState.isCodeBlock}
            disabled={disabled}
            label="Code block"
            onPress={handleCodeBlock}
            text="Block code"
          />
          <ToolbarButton
            disabled={disabled}
            label="Horizontal rule"
            onPress={handleHorizontalRule}
            text="Rule"
          />
        </div>

        <span aria-hidden="true" className="mx-0.5 h-6 w-px bg-teal-950/10" />

        <div role="group" aria-label="Links and history" className="flex items-center gap-1">
          <ToolbarButton
            active={toolbarState.isLink}
            disabled={disabled}
            label="Edit link"
            onPress={handleOpenLinkEditor}
            text="Link"
          />
          <ToolbarButton
            disabled={disabled || !toolbarState.canUndo}
            label="Undo"
            onPress={handleUndo}
            text="Undo"
          />
          <ToolbarButton
            disabled={disabled || !toolbarState.canRedo}
            label="Redo"
            onPress={handleRedo}
            text="Redo"
          />
        </div>
      </div>

      {isLinkEditorOpen ? (
        <form
          className="flex flex-col gap-3 border-t border-teal-950/10 bg-white/80 px-4 py-3 sm:flex-row sm:items-end"
          noValidate
          onSubmit={handleApplyLink}
        >
          <div className="min-w-0 flex-1">
            <label htmlFor="note-link-url" className="mb-1.5 block text-xs font-bold text-teal-950">
              Link address
            </label>
            <input
              id="note-link-url"
              type="url"
              autoFocus
              disabled={disabled}
              inputMode="url"
              onChange={handleLinkUrlChange}
              placeholder="https://example.com"
              value={linkUrl}
              className="w-full rounded-lg border border-teal-950/15 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
            />
            {linkError ? (
              <p className="mt-1.5 text-xs font-medium text-red-700" role="alert">
                {linkError}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={disabled}
              className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-800 disabled:opacity-50"
            >
              Apply link
            </button>
            {toolbarState.isLink ? (
              <button
                type="button"
                disabled={disabled}
                onClick={handleRemoveLink}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                Remove
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleCloseLinkEditor}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
