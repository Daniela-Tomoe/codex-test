import "server-only";

import type { JSONContent } from "@tiptap/react";

import { MAX_NOTE_CONTENT_BYTES, MAX_NOTE_TITLE_LENGTH } from "@/src/lib/note-contracts";

const allowedNodeTypes = new Set([
  "blockquote",
  "bulletList",
  "codeBlock",
  "doc",
  "hardBreak",
  "heading",
  "horizontalRule",
  "listItem",
  "orderedList",
  "paragraph",
  "text",
]);

const allowedMarkTypes = new Set(["bold", "code", "italic", "link", "strike", "underline"]);
const maximumDocumentDepth = 100;

type ValidationResult<T> = { ok: true; value: T } | { error: string; ok: false };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyJsonPrimitiveValues(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return Object.values(value).every(
    (attribute) =>
      attribute === null ||
      typeof attribute === "boolean" ||
      typeof attribute === "number" ||
      typeof attribute === "string",
  );
}

function isAllowedHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

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

function isValidLinkMark(mark: Record<string, unknown>): boolean {
  if (!isRecord(mark.attrs)) {
    return false;
  }

  const { attrs } = mark;
  const allowedAttributeNames = new Set(["class", "href", "rel", "target"]);

  if (Object.keys(attrs).some((attribute) => !allowedAttributeNames.has(attribute))) {
    return false;
  }

  return (
    isAllowedHttpUrl(attrs.href) &&
    (attrs.target === undefined || attrs.target === "_blank") &&
    (attrs.rel === undefined || attrs.rel === "noopener noreferrer") &&
    (attrs.class === undefined || attrs.class === null)
  );
}

function isValidMark(value: unknown): boolean {
  if (!isRecord(value) || typeof value.type !== "string" || !allowedMarkTypes.has(value.type)) {
    return false;
  }

  if (Object.keys(value).some((key) => key !== "attrs" && key !== "type")) {
    return false;
  }

  if (value.type === "link") {
    return isValidLinkMark(value);
  }

  return value.attrs === undefined || hasOnlyJsonPrimitiveValues(value.attrs);
}

function isValidNode(value: unknown, depth = 0): boolean {
  if (
    depth > maximumDocumentDepth ||
    !isRecord(value) ||
    typeof value.type !== "string" ||
    !allowedNodeTypes.has(value.type)
  ) {
    return false;
  }

  if (
    Object.keys(value).some(
      (key) =>
        key !== "attrs" && key !== "content" && key !== "marks" && key !== "text" && key !== "type",
    )
  ) {
    return false;
  }

  if (value.attrs !== undefined && !hasOnlyJsonPrimitiveValues(value.attrs)) {
    return false;
  }

  if (
    value.type === "heading" &&
    (!isRecord(value.attrs) ||
      typeof value.attrs.level !== "number" ||
      ![1, 2, 3].includes(value.attrs.level))
  ) {
    return false;
  }

  if (value.type === "text") {
    if (typeof value.text !== "string" || value.content !== undefined) {
      return false;
    }
  } else if (value.text !== undefined) {
    return false;
  }

  if (value.marks !== undefined) {
    if (!Array.isArray(value.marks) || !value.marks.every(isValidMark)) {
      return false;
    }
  }

  if (value.content !== undefined) {
    if (
      !Array.isArray(value.content) ||
      !value.content.every((node) => isValidNode(node, depth + 1))
    ) {
      return false;
    }
  }

  return true;
}

export function validateNoteTitle(value: unknown): ValidationResult<string> {
  if (typeof value !== "string") {
    return { error: "Enter a valid note title.", ok: false };
  }

  if (value.length > MAX_NOTE_TITLE_LENGTH) {
    return { error: `Keep the title under ${MAX_NOTE_TITLE_LENGTH} characters.`, ok: false };
  }

  return { ok: true, value };
}

export function validateNoteContent(value: unknown): ValidationResult<{
  contentJson: JSONContent;
  serializedContent: string;
}> {
  let serializedContent: string;

  try {
    serializedContent = JSON.stringify(value);
  } catch {
    return { error: "The note content is invalid.", ok: false };
  }

  if (new TextEncoder().encode(serializedContent).byteLength > MAX_NOTE_CONTENT_BYTES) {
    return { error: "This note is too large to save.", ok: false };
  }

  let contentJson: unknown;

  try {
    contentJson = JSON.parse(serializedContent) as unknown;
  } catch {
    return { error: "The note content is invalid.", ok: false };
  }

  if (!isValidNode(contentJson) || !isRecord(contentJson) || contentJson.type !== "doc") {
    return { error: "The note contains unsupported content.", ok: false };
  }

  return {
    ok: true,
    value: {
      contentJson: contentJson as JSONContent,
      serializedContent,
    },
  };
}
