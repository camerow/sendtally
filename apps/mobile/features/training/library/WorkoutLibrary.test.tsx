import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import type { WorkoutRecord } from "@sendtally/api-client";
import { hangData, renderWithHang } from "../data/renderWithHang";
import { CategoryScreen } from "./CategoryScreen";
import { WorkoutLibrary } from "./WorkoutLibrary";

jest.mock("expo-router", () => ({ router: { push: jest.fn(), back: jest.fn() } }));
const legs: WorkoutRecord = {
  id: "w1",
  kind: "strength",
  name: "Leg day",
  description: "",
  minutes: 45,
  targetRpe: null,
  variations: [{ label: "", items: [] }],
  pattern: [0],
  exerciseRestS: 180,
  updatedAt: "2026-10-01T00:00:00Z",
};
const show = (ui: React.ReactElement): Promise<unknown> =>
  renderWithHang(ui, hangData(), { workouts: [legs] });

describe("Workout library", () => {
  it("shelves every category with the user's own mixed in and labelled", async () => {
    await show(<WorkoutLibrary />);
    for (const kind of ["Hangboard", "Climbing", "Strength", "Mobility", "Other"])
      expect(screen.getByLabelText(`See all ${kind}`)).toBeTruthy();
    expect(screen.getByText("Leg day")).toBeTruthy();
    expect(screen.getByText("Max hangs")).toBeTruthy();
    expect(screen.getAllByText("Mine")).toHaveLength(1);
    expect(screen.queryByText(/Built in/)).toBeNull();

    await fireEvent.press(screen.getByText("Max hangs"));
    expect(router.push).toHaveBeenLastCalledWith({
      pathname: "/workout/preview",
      params: { id: "max10" },
    });
  });

  it("opens a whole category from its shelf, to search", async () => {
    await show(<WorkoutLibrary />);
    await fireEvent.press(screen.getByLabelText("See all Strength"));
    expect(router.push).toHaveBeenLastCalledWith({
      pathname: "/workout/category",
      params: { kind: "strength" },
    });

    await show(<CategoryScreen kind="strength" />);
    expect(screen.getByText("Leg day")).toBeTruthy();
    expect(screen.getByText("5x5 strength")).toBeTruthy();
    expect(screen.queryByText("Max hangs")).toBeNull();

    await fireEvent.changeText(screen.getByLabelText("Search workouts"), "leg");
    expect(screen.queryByText("5x5 strength")).toBeNull();
    await fireEvent.press(screen.getByText("Leg day"));
    expect(router.push).toHaveBeenLastCalledWith({
      pathname: "/workout/preview",
      params: { id: "w1" },
    });
  });

  it("lists the matches in place of the shelves while a search is typed", async () => {
    await show(<WorkoutLibrary />);
    await fireEvent.changeText(screen.getByLabelText("Search workouts"), "max");
    expect(screen.getByText("Max hangs")).toBeTruthy();
    expect(screen.queryByText("Leg day")).toBeNull();
    expect(screen.queryByLabelText("See all Hangboard")).toBeNull();
  });
});
