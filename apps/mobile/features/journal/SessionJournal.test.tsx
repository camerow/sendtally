import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import type { JournalEntry } from "@sendtally/api-client";
import { SessionJournal } from "./SessionJournal";

const entry = {
  id: "e1",
  kind: "journal",
  title: null,
  body: "Cold and greasy after 3.",
  occurred_at: "2026-11-04",
} as JournalEntry;

describe("SessionJournal", () => {
  it("is a Notes section with a round + and one muted line when empty", async () => {
    const onAdd = jest.fn();
    await render(<SessionJournal entries={[]} onAdd={onAdd} onOpen={jest.fn()} />);
    expect(screen.getByText("Notes")).toBeTruthy();
    expect(screen.getByText("Nothing written yet")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Add a note"));
    expect(onAdd).toHaveBeenCalled();
  });

  it("lists a note by its date and text, handing it to the edit sheet on a tap", async () => {
    const onOpen = jest.fn();
    await render(<SessionJournal entries={[entry]} onAdd={jest.fn()} onOpen={onOpen} />);
    expect(screen.getByText("Nov 4")).toBeTruthy();
    await fireEvent.press(screen.getByText("Cold and greasy after 3."));
    expect(onOpen).toHaveBeenCalledWith(entry);
  });
});
