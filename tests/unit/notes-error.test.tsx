import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import NotesError from "@/app/(notes)/notes/error";

describe("NotesError", () => {
  it("presents a generic message and retries through the route boundary", () => {
    const reset = vi.fn();

    render(<NotesError error={new Error("database details")} reset={reset} />);

    expect(screen.getByRole("heading", { name: "We couldn’t open your notes" })).toBeDefined();
    expect(screen.queryByText("database details")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
