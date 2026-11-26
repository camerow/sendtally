import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import type * as Workouts from "@sendtally/features/workouts";
import { setPlanPath, type PlanPath, type Wizard } from "@sendtally/features/settings";
import { anExercise, hangData, renderWithHang } from "../../training/data/renderWithHang";
import { WorkoutStep } from "./WorkoutStep";

const mockWorkouts = { saveWorkout: jest.fn(async () => undefined), deleteWorkout: jest.fn() };

const mockApi = new Proxy(
  {},
  { get: (_, key) => (key === "then" ? undefined : () => new Promise(() => {})) }
) as SendtallyApi;

jest.mock("../../../lib/api", () => ({ useApi: () => mockApi }));
jest.mock("expo-router", () => ({ router: { back: jest.fn(), push: jest.fn() } }));
jest.mock("expo-crypto", () => ({ randomUUID: () => "id-new" }));
jest.mock("@sendtally/features/workouts", () => ({
  ...jest.requireActual<typeof Workouts>("@sendtally/features/workouts"),
  useWorkoutActions: () => mockWorkouts,
}));

const pickedNow = (): readonly string[] => {
  const seen: PlanPath[] = [];
  setPlanPath((p) => {
    seen.push(p);
    return p;
  });
  return seen[0]?.workouts ?? [];
};

const wizard = {
  path: "plan",
  step: "P2",
  canGoBack: true,
  position: { n: 0, total: 0 },
  memory: { way: null, existingLog: null },
  choose: jest.fn(),
  answerLog: jest.fn(),
  setWay: jest.fn(),
  open: jest.fn(),
  next: jest.fn(),
  back: jest.fn(),
  skip: jest.fn(),
  leave: jest.fn(),
  complete: jest.fn(),
  capture: jest.fn(),
} satisfies Wizard;

beforeEach(() => {
  jest.clearAllMocks();
  setPlanPath(() => ({
    workouts: ["climb-session"],
    days: {},
    members: {},
    blockId: null,
    seeded: true,
  }));
});

describe("Build my own, opened from Build your week", () => {
  it("has no name to type and no Skip, names the workout by its kind and puts it first", async () => {
    await renderWithHang(<WorkoutStep wizard={wizard} api={mockApi} />, hangData(), {
      exercises: [anExercise("e1", "Back squat", "strength")],
    });
    expect(screen.queryByText("Workout name")).toBeNull();
    expect(screen.queryByText("Skip")).toBeNull();
    await fireEvent.press(screen.getByLabelText("Add Back squat"));
    await fireEvent.press(screen.getByRole("button", { name: /^Continue · 1 exercise/ }));
    expect(mockWorkouts.saveWorkout).toHaveBeenCalledWith(
      "id-new",
      expect.objectContaining({ name: "Strength workout" })
    );
    expect(pickedNow()).toEqual(["id-new", "climb-session"]);
    expect(wizard.next).toHaveBeenCalledTimes(1);
  });
});
