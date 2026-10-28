import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import type { ExerciseGroupVM } from "@sendtally/features/statistics";
import { anExercise, hangData, renderWithHang } from "../data/renderWithHang";
import { ExerciseGroups } from "./ExerciseGroups";

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("../../../lib/api", () => ({ useApi: () => undefined }));
jest.mock("@sendtally/features/activities", () => ({
  ...jest.requireActual<object>("@sendtally/features/activities"),
  useWeightUnit: () => "kg",
}));

const hang = {
  id: "h1",
  workoutId: "fingers-ab",
  gripId: "half",
  date: "2026-09-20",
  edgeMm: 20,
  loadKg: 4,
  pct: 100,
  misses: 0,
  rpe: null,
  membershipId: null,
  week: null,
  focus: null,
  done: [],
  protocol: {
    name: "Fingers A/B",
    kind: "hang" as const,
    hangS: 10,
    restS: 0,
    reps: 1,
    sets: 6,
    setRestS: 180,
  },
  stravaActivityId: null,
  postState: null,
  postError: null,
  updatedAt: "t",
};

const groups: ExerciseGroupVM[] = [
  {
    kind: "hangboard",
    rows: [{ key: "half", name: "Half crimp", count: 1, values: [4], change: 0, metric: "load" }],
  },
  {
    kind: "strength",
    rows: [
      { key: "pull-up", name: "Pull-up", count: 2, values: [5, 10], change: 5, metric: "load" },
      { key: "dips", name: "Dips", count: 1, values: [0], change: 0, metric: "load" },
    ],
  },
];

describe("exercise trends", () => {
  it("opens an exercise's trend over time, a grip's on its workout", async () => {
    await renderWithHang(<ExerciseGroups groups={groups} />, hangData({ sessions: [hang] }), {
      exercises: [anExercise("e1", "Pull-up", "strength")],
    });
    const pullUp = screen.getByLabelText("Pull-up, 2 times, +5 kg");
    expect(pullUp.props.accessibilityRole).toBe("button");
    await fireEvent.press(pullUp);
    expect(router.push).toHaveBeenCalledWith({ pathname: "/exercise/[id]", params: { id: "e1" } });

    await fireEvent.press(screen.getByLabelText(/^Half crimp/));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/workout/[id]",
      params: { id: "fingers-ab", grip: "half" },
    });
  });

  it("leaves a row with nowhere to go as a plain row", async () => {
    await renderWithHang(<ExerciseGroups groups={groups} />);
    expect(screen.getByLabelText(/^Dips/).props.accessibilityRole).toBeUndefined();
  });
});
