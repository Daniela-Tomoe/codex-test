import { describe, expect, it } from "vitest";

import { MAX_NOTE_CONTENT_BYTES, MAX_NOTE_TITLE_LENGTH } from "@/src/lib/note-contracts";
import { validateNoteContent, validateNoteTitle } from "@/src/lib/note-validation";

describe("validateNoteTitle", () => {
  it("accepts empty titles and the maximum supported length", () => {
    expect(validateNoteTitle("")).toEqual({ ok: true, value: "" });

    const maximumTitle = "a".repeat(MAX_NOTE_TITLE_LENGTH);
    expect(validateNoteTitle(maximumTitle)).toEqual({ ok: true, value: maximumTitle });
  });

  it("rejects non-string and oversized titles", () => {
    expect(validateNoteTitle(undefined)).toEqual({
      error: "Enter a valid note title.",
      ok: false,
    });
    expect(validateNoteTitle("a".repeat(MAX_NOTE_TITLE_LENGTH + 1))).toEqual({
      error: `Keep the title under ${MAX_NOTE_TITLE_LENGTH} characters.`,
      ok: false,
    });
  });
});

describe("validateNoteContent", () => {
  it("accepts supported TipTap nodes, marks, and secure links", () => {
    const content = {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Heading", marks: [{ type: "bold" }] }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Link",
              marks: [
                {
                  type: "link",
                  attrs: {
                    class: null,
                    href: "https://example.com/path",
                    rel: "noopener noreferrer",
                    target: "_blank",
                  },
                },
              ],
            },
          ],
        },
        { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph" }] }] },
        { type: "orderedList", content: [{ type: "listItem", content: [{ type: "paragraph" }] }] },
        { type: "blockquote", content: [{ type: "paragraph" }] },
        { type: "codeBlock", content: [{ type: "text", text: "const value = 1;" }] },
        { type: "horizontalRule" },
        { type: "hardBreak" },
      ],
    };

    const result = validateNoteContent(content);

    expect(result).toEqual({
      ok: true,
      value: {
        contentJson: content,
        serializedContent: JSON.stringify(content),
      },
    });
  });

  it.each([
    ["a non-document root", { type: "paragraph" }],
    ["an unsupported node", { type: "doc", content: [{ type: "image" }] }],
    ["unknown node properties", { type: "doc", onclick: "alert(1)" }],
    ["nested attributes", { type: "doc", content: [{ type: "paragraph", attrs: { data: {} } }] }],
    [
      "an invalid heading level",
      { type: "doc", content: [{ type: "heading", attrs: { level: 4 } }] },
    ],
    [
      "text nodes with child content",
      { type: "doc", content: [{ type: "text", text: "x", content: [] }] },
    ],
    ["non-text nodes with text", { type: "doc", content: [{ type: "paragraph", text: "x" }] }],
    [
      "an unsupported mark",
      { type: "doc", content: [{ type: "text", text: "x", marks: [{ type: "script" }] }] },
    ],
  ])("rejects %s", (_description, content) => {
    expect(validateNoteContent(content)).toEqual({
      error: "The note contains unsupported content.",
      ok: false,
    });
  });

  it.each([
    "javascript:alert(1)",
    "mailto:user@example.com",
    "https://user:password@example.com",
    "not a URL",
  ])("rejects unsafe link URL %s", (href) => {
    const content = {
      type: "doc",
      content: [
        {
          type: "text",
          text: "unsafe",
          marks: [{ type: "link", attrs: { href } }],
        },
      ],
    };

    expect(validateNoteContent(content)).toEqual({
      error: "The note contains unsupported content.",
      ok: false,
    });
  });

  it("rejects unsupported link attributes and target values", () => {
    const content = {
      type: "doc",
      content: [
        {
          type: "text",
          text: "unsafe",
          marks: [
            {
              type: "link",
              attrs: { href: "https://example.com", onclick: "alert(1)", target: "_self" },
            },
          ],
        },
      ],
    };

    expect(validateNoteContent(content).ok).toBe(false);
  });

  it("rejects documents nested beyond the supported depth", () => {
    let nestedNode: Record<string, unknown> = { type: "paragraph" };

    for (let depth = 0; depth < 101; depth += 1) {
      nestedNode = { type: "blockquote", content: [nestedNode] };
    }

    expect(validateNoteContent({ type: "doc", content: [nestedNode] })).toEqual({
      error: "The note contains unsupported content.",
      ok: false,
    });
  });

  it("rejects circular content that cannot be serialized", () => {
    const content: Record<string, unknown> = { type: "doc" };
    content.content = [content];

    expect(validateNoteContent(content)).toEqual({
      error: "The note content is invalid.",
      ok: false,
    });
  });

  it("measures the serialized payload in UTF-8 bytes", () => {
    const content = {
      type: "doc",
      content: [{ type: "text", text: "é".repeat(MAX_NOTE_CONTENT_BYTES / 2) }],
    };

    expect(validateNoteContent(content)).toEqual({
      error: "This note is too large to save.",
      ok: false,
    });
  });
});
