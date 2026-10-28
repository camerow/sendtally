import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import type { ActivityRecord } from "@sendtally/api-client";
import { aHang, anExercise, renderWithHang, hangData } from "../data/renderWithHang";
import { ExerciseShelves } from "./ExerciseShelves";

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("@sendtally/features/activities", () => ({
  ...jest.requireActual<object>("@sendtally/features/activities"),
  useWeightUnit: () => "kg",
}));

const plank: ActivityRecord = {
  id: "a1",
  kind: "strength",
  title: "Core",
  date: "2026-09-22",
  startTime: null,
  minutes: 20,
  rpe: null,
  notes: null,
  workoutId: null,
  membershipId: null,
  week: null,
  done: [{ item: 0, exercise: "Plank", sets: [{ onS: 45 }, { onS: 60 }] }],
  stravaActivityId: null,
  postedAt: null,
  postState: null,
  postError: null,
};

describe("exercise shelves", () => {
  it("shelves exercises by kind with their best, and opens one", async () => {
    await renderWithHang(<ExerciseShelves />, hangData(), {
      exercises: [anExercise("e1", "Plank", "strength"), anExercise("e2", "Pigeon", "mobility")],
      activities: [plank],
    });
    expect(screen.getByText("Strength")).toBeTruthy();
    expect(screen.getByText("Mobility")).toBeTruthy();
    expect(screen.getByText("Best 60s")).toBeTruthy();
    await fireEvent.press(screen.getByText("Pigeon"));
    expect(router.push).toHaveBeenCalledWith({ pathname: "/exercise/[id]", params: { id: "e2" } });
  });

  it("shows every category with a hint when empty, See all when not, and a plus for each", async () => {
    await renderWithHang(<ExerciseShelves />, hangData(), {
      exercises: [
        anExercise("e1", "Plank", "strength"),
        anExercise("e2", "Pigeon", "mobility", { archived: true }),
      ],
    });
    for (const kind of ["Fingers", "Climbing", "Strength", "Mobility", "Other"])
      expect(screen.getByText(kind)).toBeTruthy();
    expect(screen.queryByText("Pigeon")).toBeNull();
    expect(screen.getByText("A stretch or a hold, like Pancake.")).toBeTruthy();
    expect(screen.queryByText("1")).toBeNull();
    expect(screen.getByLabelText("See all Strength")).toBeTruthy();
    expect(screen.queryByLabelText("See all Climbing")).toBeNull();
    expect(screen.queryByLabelText("See all Mobility")).toBeNull();

    await fireEvent.press(screen.getByLabelText("See all Strength"));
    expect(router.push).toHaveBeenLastCalledWith({
      pathname: "/exercise/category",
      params: { kind: "strength" },
    });
    await fireEvent.press(screen.getByLabelText("New exercise in Climbing"));
    expect(router.push).toHaveBeenLastCalledWith({
      pathname: "/exercise/edit",
      params: { kind: "climbing" },
    });
  });

  it("says a grip's best completed load, or its last load before one is complete", async () => {
    await renderWithHang(
      <ExerciseShelves />,
      hangData({
        sessions: [
          aHang({ gripId: "half", date: "2026-09-01", loadKg: 4 }),
          aHang({ gripId: "half", date: "2026-09-08", loadKg: 6, pct: 50 }),
          aHang({ gripId: "open", date: "2026-09-02", loadKg: 12, pct: 80 }),
          aHang({ gripId: "pinch", date: "2026-09-03", loadKg: 0, pct: 80, edgeMm: 15 }),
        ],
      })
    );
    expect(screen.getByText("Best +4 kg · 20\u00A0mm")).toBeTruthy();
    expect(screen.getByText("Last +12 kg · 20\u00A0mm")).toBeTruthy();
    expect(screen.getByText("Last bodyweight · 15\u00A0mm")).toBeTruthy();
  });
});
