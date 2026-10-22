import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { libraryOf, type WorkoutLibrary } from "@sendtally/features/workouts";
import { LibraryBrowser } from "./LibraryBrowser";

const workouts = libraryOf([
  {
    id: "w1",
    kind: "strength",
    name: "Leg day",
    description: "",
    minutes: 45,
    targetRpe: null,
    variations: [{ label: "", items: [] }],
    pattern: [0],
    updatedAt: "2026-10-01T00:00:00Z",
  },
]);
const library: WorkoutLibrary = {
  workouts,
  usage: new Map(),
  workout: (id) => workouts.find((w) => w.id === id),
};

describe("Library browser", () => {
  it("shows the user's own first and folds the built-ins behind one row", async () => {
    const onPick = jest.fn();
    await render(<LibraryBrowser library={library} onPick={onPick} />);
    expect(screen.getByText("Leg day")).toBeTruthy();
    expect(screen.queryByText("Max hangs")).toBeNull();

    await fireEvent.press(screen.getByText(`Built in · ${workouts.length - 1}`));
    await fireEvent.press(screen.getByText("Max hangs"));
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ id: "max10" }));
  });

  it("opens the built-ins while a search is typed", async () => {
    await render(<LibraryBrowser library={library} onPick={() => undefined} />);
    await fireEvent.changeText(screen.getByLabelText("Search workouts"), "max");
    expect(screen.getByText("Max hangs")).toBeTruthy();
    expect(screen.queryByText("Leg day")).toBeNull();
  });
});
