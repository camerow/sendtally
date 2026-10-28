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
  items: [],
  exerciseRestS: 180,
  focus: "strength",
  updatedAt: "2026-10-01T00:00:00Z",
};
const show = (ui: React.ReactElement): Promise<unknown> =>
  renderWithHang(ui, hangData(), { workouts: [legs] });

describe("Workout library", () => {
  it("shelves every focus with the user's own mixed in and labelled, General last", async () => {
    await show(<WorkoutLibrary />);
    const shelves = ["Strength", "Power", "Power endurance", "Endurance", "Conditioning"];
    for (const focus of [...shelves, "Recovery", "General"])
      expect(screen.getByLabelText(`See all ${focus}`)).toBeTruthy();
    expect(screen.queryByLabelText("See all Skill")).toBeNull();
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

  it("opens a whole focus from its shelf, to search", async () => {
    await show(<WorkoutLibrary />);
    await fireEvent.press(screen.getByLabelText("See all Strength"));
    expect(router.push).toHaveBeenLastCalledWith({
      pathname: "/workout/category",
      params: { focus: "strength" },
    });

    await show(<CategoryScreen focus="strength" />);
    expect(
      screen.getByText("Heavy efforts with long rests, like max hangs and big lifts.")
    ).toBeTruthy();
    expect(screen.getByText("Leg day")).toBeTruthy();
    expect(screen.getByText("5x5 strength")).toBeTruthy();
    expect(screen.getByText("Max hangs")).toBeTruthy();
    expect(screen.queryByText("Repeaters 7:3")).toBeNull();

    await fireEvent.changeText(screen.getByLabelText("Search Strength"), "leg");
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
    expect(screen.queryByLabelText("See all Strength")).toBeNull();
  });
});
