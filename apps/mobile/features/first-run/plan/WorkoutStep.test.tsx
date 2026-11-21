import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import React from "react";
import type { SendtallyApi, WorkoutRecord } from "@sendtally/api-client";
import type * as Workouts from "@sendtally/features/workouts";
import { setPlanPath, type Wizard } from "@sendtally/features/settings";
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

const unnamed: WorkoutRecord = {
  id: "w1",
  kind: "strength",
  name: "",
  description: "",
  minutes: 30,
  targetRpe: null,
  items: [{ exercise: "Back squat", doses: [{ sets: 3, reps: 5 }] }],
  exerciseRestS: 180,
  focus: null,
  updatedAt: "t",
};

const wizard = {
  path: "plan",
  step: "P2",
  canGoBack: true,
  position: { n: 2, total: 7 },
  memory: { way: "by_hand", existingLog: "none", days: [], membershipShown: false },
  choose: jest.fn(),
  answerLog: jest.fn(),
  setWay: jest.fn(),
  setDays: jest.fn(),
  next: jest.fn(),
  back: jest.fn(),
  skip: jest.fn(),
  leave: jest.fn(),
  complete: jest.fn(),
  capture: jest.fn(),
} satisfies Wizard;

beforeEach(() => {
  jest.clearAllMocks();
  setPlanPath((p) => ({ ...p, building: "w1" }));
});

describe("P2's name", () => {
  it("starts as the first exercise's kind, so Continue is on with an exercise and no typed name", async () => {
    await renderWithHang(<WorkoutStep wizard={wizard} api={mockApi} />, hangData(), {
      workouts: [unnamed],
      exercises: [anExercise("e1", "Back squat", "strength")],
    });
    expect(screen.getByDisplayValue("Strength workout")).toBeTruthy();
    const next = screen.getByRole("button", { name: /^Continue/ });
    expect(next.props.accessibilityState).toMatchObject({ disabled: false });
    await fireEvent.press(next);
    expect(mockWorkouts.saveWorkout).toHaveBeenCalledWith(
      "w1",
      expect.objectContaining({ name: "Strength workout" })
    );
    expect(wizard.next).toHaveBeenCalledTimes(1);
  });
});
