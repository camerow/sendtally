import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import { Alert } from "react-native";
import type { WorkoutRecord } from "@sendtally/api-client";
import { TEST_LIBRARY } from "@sendtally/features/library/testing";
import { hangData, renderWithHang } from "../data/renderWithHang";
import { CategoryScreen } from "./CategoryScreen";
import { WorkoutLibrary } from "./WorkoutLibrary";

jest.mock("expo-router", () => ({ router: { push: jest.fn(), back: jest.fn() } }));
let mockAccess: boolean | null = null;
jest.mock("../../billing/useBilling", () => ({
  useBilling: () => (mockAccess === null ? null : { membership: { access: mockAccess } }),
}));
jest.mock("../../../components/Sheet", () => {
  const { useEffect } = jest.requireActual<typeof React>("react");
  return {
    Sheet: function MockSheet({
      visible,
      onClose,
      children,
    }: {
      visible: boolean;
      onClose: () => void;
      children: React.ReactNode;
    }) {
      useEffect(() => {
        if (!visible) onClose();
      }, [visible, onClose]);
      return visible ? children : null;
    },
  };
});
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
  beforeEach(() => {
    mockAccess = null;
  });

  it("lists every focus and its first three, an empty one saying what it trains, with See all only where there are more", async () => {
    await show(<WorkoutLibrary />);
    const shelves = ["Strength", "Power", "Power endurance", "Endurance", "Conditioning"];
    for (const focus of [...shelves, "Skill", "Recovery", "General"])
      expect(screen.getByLabelText(`New workout in ${focus}`)).toBeTruthy();
    expect(screen.getByText("Movement and technique, well within your limit.")).toBeTruthy();
    expect(screen.getByLabelText("See all Strength")).toBeTruthy();
    const strength = TEST_LIBRARY.workouts.filter((w) => w.spec.focus === "strength").length;
    expect(screen.getByText(`See all ${strength + 1}`)).toBeTruthy();
    expect(screen.queryByLabelText("See all Power")).toBeNull();
    expect(screen.getByText("Max hangs")).toBeTruthy();
    expect(screen.queryByText(/Built in/)).toBeNull();

    await fireEvent.press(screen.getByText("Max hangs"));
    expect(router.push).toHaveBeenLastCalledWith({
      pathname: "/workout/[id]",
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
      pathname: "/workout/[id]",
      params: { id: "w1" },
    });
  });

  it("makes a new workout in a shelf's focus without asking its category", async () => {
    await show(<WorkoutLibrary />);
    await fireEvent.press(screen.getByLabelText("New workout in Power"));
    expect(router.push).toHaveBeenLastCalledWith({
      pathname: "/workout/edit",
      params: { focus: "power" },
    });
  });

  it("lists the matches in place of the shelves while a search is typed", async () => {
    await show(<WorkoutLibrary />);
    await fireEvent.changeText(screen.getByLabelText("Search workouts"), "max");
    expect(screen.getByText("Max hangs")).toBeTruthy();
    expect(screen.queryByText("Leg day")).toBeNull();
    expect(screen.queryByLabelText("See all Strength")).toBeNull();
  });

  it("locks the user's own workout and the shelf plus past the trial, and leaves a built-in open", async () => {
    mockAccess = false;
    await show(<WorkoutLibrary />);
    await fireEvent.press(screen.getByLabelText("Leg day, members only"));
    expect(router.push).toHaveBeenLastCalledWith({
      pathname: "/membership",
      params: { source: "workout" },
    });
    await fireEvent.press(screen.getByLabelText("New workout in Strength, members only"));
    expect(router.push).toHaveBeenLastCalledWith({
      pathname: "/membership",
      params: { source: "create" },
    });
    await fireEvent.press(screen.getByLabelText("Max hangs"));
    expect(router.push).toHaveBeenLastCalledWith({
      pathname: "/workout/[id]",
      params: { id: "max10" },
    });
  });

  it("offers Delete and nothing else on a long press of a locked workout", async () => {
    mockAccess = false;
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    await show(<WorkoutLibrary />);
    const row = screen.getByLabelText("Leg day, members only");
    expect(row.props.accessibilityActions).toEqual([
      { name: "longpress", label: "Delete workout" },
    ]);
    expect(screen.queryByLabelText("Max hangs")?.props.accessibilityActions).toBeUndefined();
    await fireEvent(row, "longPress");
    expect(screen.getByText("Delete workout")).toBeTruthy();
    for (const other of ["Duplicate", "Add to block", "Edit", "Start", "Log it"])
      expect(screen.queryByText(other)).toBeNull();
    await fireEvent.press(screen.getByText("Delete workout"));
    expect(alert).toHaveBeenCalledWith(
      expect.stringContaining("Leg day"),
      expect.anything(),
      expect.anything()
    );
  });
});
