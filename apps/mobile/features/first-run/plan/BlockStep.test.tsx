import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import React from "react";
import type { Plan, SendtallyApi, WorkoutRecord } from "@sendtally/api-client";
import { setPlanPath, type Wizard } from "@sendtally/features/settings";
import { hangData, renderWithHang } from "../../training/data/renderWithHang";
import { BlockStep } from "./BlockStep";

const mockPlan = { saveDraft: jest.fn(async () => undefined) };

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
  blocks: [
    {
      id: "b1",
      name: "November block",
      description: "",
      start: "2026-11-30",
      weeks: 4,
      focus: null,
    },
  ],
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
    workouts: ["legs"],
    days: { legs: [1] },
    members: { legs: "m1" },
    blockId: "b1",
    seeded: true,
  }));
});

describe("Shape the weeks, opened from the reveal", () => {
  it("has no name to type and no Skip, and Save keeps the block's name and goes back", async () => {
    await renderWithHang(<BlockStep wizard={wizard} api={mockApi} />, hangData(), {
      workouts: [legs],
      plan,
    });
    expect(screen.queryByText("Block name")).toBeNull();
    expect(screen.queryByText("Skip")).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect(mockPlan.saveDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        block: expect.objectContaining({ name: "November block", weeks: 4 }),
      })
    );
    expect(wizard.next).toHaveBeenCalledTimes(1);
  });
});

describe("Shape the weeks, opened a second time", () => {
  const shaped: Plan = {
    ...plan,
    weekChanges: [{ membershipId: "m1", week: 2, dose: 0, itemId: "0", change: { reps: 6 } }],
  };
  const show = (): Promise<unknown> =>
    renderWithHang(<BlockStep wizard={wizard} api={mockApi} />, hangData(), {
      workouts: [legs],
      plan: shaped,
    });
  const saved = (): unknown => mockPlan.saveDraft.mock.calls.at(-1)?.at(0);

  it("shows the first visit's changes and saves them again when left untouched", async () => {
    await show();
    expect(screen.getAllByText("6 reps").length).toBeGreaterThan(0);
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect(saved()).toEqual(expect.objectContaining({ weekChanges: shaped.weekChanges }));
  });

  it("sends an empty change for a shaped week that is cleared", async () => {
    await show();
    const addRep = screen.getByRole("checkbox", { name: "Add a rep each week" });
    await fireEvent.press(addRep);
    await fireEvent.press(addRep);
    expect(screen.queryAllByText("6 reps")).toHaveLength(0);
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect(saved()).toEqual(
      expect.objectContaining({
        weekChanges: [{ membershipId: "m1", week: 2, dose: 0, itemId: "0", change: {} }],
      })
    );
  });
});
