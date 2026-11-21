import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import React from "react";
import type { Plan, SendtallyApi, WorkoutRecord } from "@sendtally/api-client";
import { setPlanPath, type Wizard } from "@sendtally/features/settings";
import { hangData, renderWithHang } from "../../training/data/renderWithHang";
import { BlockStep } from "./BlockStep";

const mockPlan = {
  saveDraft: jest.fn(async () => undefined),
  saveMembership: jest.fn(async () => undefined),
};

const mockApi = new Proxy(
  {},
  { get: (_, key) => (key === "then" ? undefined : () => new Promise(() => {})) }
) as SendtallyApi;

jest.mock("../../../lib/api", () => ({ useApi: () => mockApi }));
jest.mock("../../training/plan/usePlanActions", () => ({ usePlanActions: () => mockPlan }));
jest.mock("expo-router", () => ({ router: { back: jest.fn(), push: jest.fn() } }));

const legs: WorkoutRecord = {
  id: "legs",
  kind: "strength",
  name: "Gym, legs",
  description: "",
  minutes: 50,
  targetRpe: null,
  items: [{ exercise: "Back squat", doses: [{ sets: 5, reps: 5 }] }],
  exerciseRestS: 180,
  focus: null,
  updatedAt: "t",
};

const plan: Plan = {
  blocks: [{ id: "b1", name: "", description: "", start: null, weeks: 4, focus: null }],
  memberships: [
    { id: "m1", workoutId: "legs", blockId: "b1", weekdays: [1], start: "2026-10-05", position: 0 },
  ],
  weekChanges: [],
  planChanges: [],
  membershipDays: [],
};

const wizard = {
  path: "plan",
  step: "P4",
  canGoBack: true,
  position: { n: 4, total: 7 },
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
  setPlanPath(() => ({
    workouts: ["legs"],
    days: { legs: [1] },
    members: { legs: "m1" },
    blockId: "b1",
    building: "legs",
  }));
});

describe("P4's name", () => {
  it("starts as the month the block starts in, so Schedule is on without typing", async () => {
    await renderWithHang(<BlockStep wizard={wizard} api={mockApi} />, hangData(), {
      workouts: [legs],
      plan,
    });
    expect(screen.getByDisplayValue("October block")).toBeTruthy();
    const schedule = screen.getByRole("button", { name: /^Schedule from/ });
    expect(schedule.props.accessibilityState).toMatchObject({ disabled: false });
    await fireEvent.press(schedule);
    expect(mockPlan.saveDraft).toHaveBeenCalledWith(
      expect.objectContaining({ block: expect.objectContaining({ name: "October block" }) })
    );
    expect(wizard.next).toHaveBeenCalledTimes(1);
  });
});
