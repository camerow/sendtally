import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import type { WorkoutRecord } from "@sendtally/api-client";
import type * as Workouts from "@sendtally/features/workouts";
import { anExercise, hangData, renderWithHang } from "../data/renderWithHang";
import { GripScreen } from "../grip/GripScreen";
import { ExerciseScreen } from "./ExerciseScreen";

const mockWorkouts = { saveWorkout: jest.fn(), deleteWorkout: jest.fn() };

jest.mock("@sendtally/features/workouts", () => ({
  ...jest.requireActual<typeof Workouts>("@sendtally/features/workouts"),
  useWorkoutActions: () => mockWorkouts,
}));
jest.mock("../../../lib/api", () => ({ useApi: () => undefined }));
jest.mock("@sendtally/features/activities", () => ({
  ...jest.requireActual<object>("@sendtally/features/activities"),
  useWeightUnit: () => "kg",
}));
jest.mock("../../../components/Sheet", () => ({
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? children : null,
}));
jest.mock("expo-router", () => ({ router: { push: jest.fn(), back: jest.fn() } }));
let mockIds = 0;
jest.mock("expo-crypto", () => ({ randomUUID: () => `id-${++mockIds}` }));

const workout = (
  over: Partial<WorkoutRecord> & Pick<WorkoutRecord, "id" | "name" | "kind">
): WorkoutRecord => ({
  description: "",
  minutes: 30,
  targetRpe: null,
  items: [],
  exerciseRestS: 180,
  focus: null,
  updatedAt: "t",
  ...over,
});

const hang = { sets: 6, reps: 1, onS: 10, offS: 0, edgeMm: 20 };
const legs = workout({
  id: "legs",
  name: "Gym, legs",
  kind: "strength",
  items: [{ exercise: "Back squat", doses: [{ sets: 5, reps: 5 }] }],
});
const pull = workout({ id: "pull", name: "Pull day", kind: "strength" });
const repeaters = workout({
  id: "repeaters",
  name: "Repeaters",
  kind: "hangboard",
  items: [{ exercise: "open", doses: [hang] }],
});
const maxHangs = workout({
  id: "max",
  name: "Max hangs",
  kind: "hangboard",
  items: [{ exercise: "half", doses: [hang] }],
});
const workouts = [legs, pull, repeaters, maxHangs];
const exercises = [
  anExercise("e1", "Back squat", "strength"),
  anExercise("e2", "Deadlift", "strength", { archived: true }),
];

const openAddToWorkout = async (): Promise<void> => {
  await fireEvent.press(screen.getByLabelText("More"));
  await fireEvent.press(screen.getByText("Add to workout"));
};

const saved = (): Workouts.WorkoutDraft => {
  const [, draft] = mockWorkouts.saveWorkout.mock.calls[0] as [string, Workouts.WorkoutDraft];
  return draft;
};

beforeEach(() => {
  jest.clearAllMocks();
  mockIds = 0;
});

describe("Add to workout, from an exercise", () => {
  it("offers only the user's own non-Fingers workouts, checking one that uses it", async () => {
    await renderWithHang(<ExerciseScreen id="e1" />, hangData(), { workouts, exercises });
    await openAddToWorkout();
    expect(screen.getByRole("radio", { name: "Gym, legs" }).props).toMatchObject({
      accessibilityState: { checked: true },
    });
    expect(screen.getByRole("radio", { name: "Pull day" })).toBeTruthy();
    expect(screen.queryByRole("radio", { name: "Repeaters" })).toBeNull();
  });

  it("adds it at the end of the workout, then says where with a way there", async () => {
    await renderWithHang(<ExerciseScreen id="e1" />, hangData(), { workouts, exercises });
    await openAddToWorkout();
    await fireEvent.press(screen.getByRole("radio", { name: "Pull day" }));
    expect(mockWorkouts.saveWorkout).toHaveBeenCalledWith("pull", expect.anything());
    expect(saved().items.map((i) => i.exercise)).toEqual(["Back squat"]);
    expect(screen.getByText("Added to Pull day")).toBeTruthy();
    await fireEvent.press(screen.getByText("View"));
    expect(router.push).toHaveBeenCalledWith({ pathname: "/workout/[id]", params: { id: "pull" } });
  });

  it("does nothing for a workout already using it", async () => {
    await renderWithHang(<ExerciseScreen id="e1" />, hangData(), { workouts, exercises });
    await openAddToWorkout();
    await fireEvent.press(screen.getByRole("radio", { name: "Gym, legs" }));
    expect(mockWorkouts.saveWorkout).not.toHaveBeenCalled();
  });

  it("is not offered for an archived exercise", async () => {
    await renderWithHang(<ExerciseScreen id="e2" />, hangData(), { workouts, exercises });
    await fireEvent.press(screen.getByLabelText("More"));
    expect(screen.queryByText("Add to workout")).toBeNull();
  });
});

describe("Add to workout, from a grip", () => {
  it("offers only the user's own Fingers workouts, never a built-in", async () => {
    await renderWithHang(<GripScreen id="half" />, hangData(), { workouts });
    await openAddToWorkout();
    expect(screen.getByRole("radio", { name: "Max hangs" }).props).toMatchObject({
      accessibilityState: { checked: true },
    });
    expect(screen.getByRole("radio", { name: "Repeaters" })).toBeTruthy();
    expect(screen.queryByRole("radio", { name: "Gym, legs" })).toBeNull();
    expect(screen.getAllByRole("radio")).toHaveLength(2);
  });

  it("adds the grip last, on the dose of the grip before it", async () => {
    await renderWithHang(<GripScreen id="half" />, hangData(), { workouts });
    await openAddToWorkout();
    await fireEvent.press(screen.getByRole("radio", { name: "Repeaters" }));
    expect(saved().items.map((i) => [i.exercise, i.doses])).toEqual([
      ["open", [hang]],
      ["half", [hang]],
    ]);
    expect(saved().items.every((i) => i.id !== undefined)).toBe(true);
  });

  it("is not offered for a hidden grip", async () => {
    const gone = { id: "g2", name: "Front 3", custom: true, hidden: true };
    await renderWithHang(<GripScreen id="g2" />, hangData({ grips: [gone] }), { workouts });
    expect(screen.queryByLabelText("More")).toBeNull();
  });
});
