import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import type { Activity } from "@sendtally/api-client";
import type * as Statistics from "@sendtally/features/statistics";
import { exerciseSeries } from "@sendtally/features/statistics";
import { ExerciseTrends } from "./ExerciseTrends";

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("../../../lib/api", () => ({ useApi: () => undefined }));
jest.mock("@sendtally/features/activities", () => ({
  ...jest.requireActual<object>("@sendtally/features/activities"),
  useWeightUnit: () => "kg",
}));
jest.mock("@sendtally/features/statistics", () => {
  const actual = jest.requireActual<typeof Statistics>("@sendtally/features/statistics");
  return {
    ...actual,
    useExerciseSeries: () => ({ status: "ready", data: actual.exerciseSeries(mockActivities) }),
  };
});

const logged = (id: string, date: string, name: string, loadKg: number, done = true): Activity => ({
  id,
  kind: "strength",
  title: "Gym",
  date,
  startTime: null,
  minutes: 60,
  rpe: null,
  notes: null,
  planItemId: null,
  workoutId: null,
  detail: {
    kind: "sets",
    exercises: [{ name, measures: ["reps", "loadKg"], sets: [{ reps: 5, loadKg, done }] }],
  },
});

let mockActivities: Activity[] = [];

describe("Exercise trends", () => {
  it("shows an empty state before any sets are logged", async () => {
    mockActivities = [];
    await render(<ExerciseTrends />);
    expect(screen.getByText(/Log sets on a training session/)).toBeTruthy();
  });

  it("opens on the asked exercise and switches from its chip", async () => {
    mockActivities = [
      logged("a", "2026-09-01", "Squat", 90),
      logged("b", "2026-09-15", "Squat", 100),
      logged("c", "2026-09-20", "Deadlift", 140),
      logged("d", "2026-09-22", "deadlift", 160, false),
    ];
    expect(exerciseSeries(mockActivities)).toHaveLength(2);
    await render(<ExerciseTrends exercise=" squat" />);
    expect(screen.getByText(/Squat is up 10 kg since/)).toBeTruthy();
    await fireEvent.press(screen.getByText("deadlift"));
    expect(screen.getByText(/deadlift has held at 140 kg since/)).toBeTruthy();
    expect(screen.getAllByText("Attempted")).toHaveLength(2);
  });
});
