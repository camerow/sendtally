import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import type { ActivityRecord } from "@sendtally/api-client";
import { anExercise, renderWithHang, hangData } from "../data/renderWithHang";
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
    await renderWithHang(<ExerciseShelves onAdd={jest.fn()} />, hangData(), {
      exercises: [anExercise("e1", "Plank", "strength"), anExercise("e2", "Pigeon", "mobility")],
      activities: [plank],
    });
    expect(screen.getByText("Strength")).toBeTruthy();
    expect(screen.getByText("Mobility")).toBeTruthy();
    expect(screen.getByText("Best 60s")).toBeTruthy();
    await fireEvent.press(screen.getByText("Pigeon"));
    expect(router.push).toHaveBeenCalledWith({ pathname: "/exercise/[id]", params: { id: "e2" } });
  });

  it("shows every category with its count, a hint when empty, and a plus for each", async () => {
    const onAdd = jest.fn();
    await renderWithHang(<ExerciseShelves onAdd={onAdd} />, hangData(), {
      exercises: [
        anExercise("e1", "Plank", "strength"),
        anExercise("e2", "Pigeon", "mobility", { archived: true }),
      ],
    });
    for (const kind of ["Fingers", "Climbing", "Strength", "Mobility", "Other"])
      expect(screen.getByText(kind)).toBeTruthy();
    expect(screen.queryByText("Pigeon")).toBeNull();
    expect(screen.getByText("A stretch or a hold, like Pancake.")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("New exercise in Climbing"));
    expect(onAdd).toHaveBeenCalledWith("climbing");
  });
});
