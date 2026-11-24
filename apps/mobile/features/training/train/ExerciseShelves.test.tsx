import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import type { WorkoutRecord } from "@sendtally/api-client";
import { TEST_LIBRARY } from "@sendtally/features/library/testing";
import { anExercise, renderWithHang, hangData } from "../data/renderWithHang";
import { ExerciseShelves } from "./ExerciseShelves";

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("@sendtally/features/activities", () => ({
  ...jest.requireActual<object>("@sendtally/features/activities"),
  useWeightUnit: () => "kg",
}));

const workout = (id: string, kind: WorkoutRecord["kind"], exercise: string): WorkoutRecord => ({
  id,
  kind,
  name: id,
  description: "",
  minutes: null,
  targetRpe: null,
  items: [{ exercise, doses: [{ sets: 3 }] }],
  exerciseRestS: 0,
  focus: null,
  updatedAt: "t",
});

describe("exercise shelves", () => {
  it("shelves exercises by kind with how many workouts use each, and opens one", async () => {
    await renderWithHang(<ExerciseShelves />, hangData(), {
      exercises: [
        anExercise("e1", "Zercher carry", "strength"),
        anExercise("e2", "Pigeon", "mobility"),
      ],
      workouts: ["a", "b", "c", "d", "e"].map((id) => workout(id, "strength", "Zercher carry")),
    });
    expect(screen.getByText("Strength")).toBeTruthy();
    expect(screen.getByText("Mobility")).toBeTruthy();
    expect(screen.getByText("In 5 workouts")).toBeTruthy();
    await fireEvent.press(screen.getByText("Pigeon"));
    expect(router.push).toHaveBeenCalledWith({ pathname: "/exercise/[id]", params: { id: "e2" } });
  });

  it("fills shelves with unclaimed built-ins after the user's own, and heads each long one with See all", async () => {
    await renderWithHang(<ExerciseShelves />, hangData(), {
      exercises: [
        anExercise("e1", "Plank", "strength"),
        anExercise("e2", "Pigeon", "mobility", { archived: true }),
      ],
    });
    for (const kind of ["Fingers", "Climbing", "Strength", "Mobility", "Other"])
      expect(screen.getByText(kind)).toBeTruthy();
    expect(screen.queryByText("Pigeon")).toBeNull();
    expect(screen.queryByLabelText("See all Other")).toBeNull();
    expect(screen.getAllByText("Not in a workout yet").length).toBeGreaterThan(0);

    await fireEvent.press(screen.getByText("Back squat"));
    expect(router.push).toHaveBeenLastCalledWith({
      pathname: "/exercise/[id]",
      params: { id: "backSquat" },
    });
    expect(
      screen.getByText(
        `See all ${TEST_LIBRARY.exercises.filter((b) => b.spec.kind === "strength").length + 1}`
      )
    ).toBeTruthy();
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
});
