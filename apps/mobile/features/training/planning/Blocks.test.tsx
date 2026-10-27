import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import type { Plan, WorkoutRecord } from "@sendtally/api-client";
import { hangData, renderWithHang } from "../data/renderWithHang";
import { BlockFormScreen } from "./BlockFormScreen";
import { BlockScreen } from "./BlockScreen";
import { LadderScreen } from "./LadderScreen";

const mockPlan = {
  saveBlock: jest.fn(),
  deleteBlock: jest.fn(),
  saveMembership: jest.fn(),
  deleteMembership: jest.fn(),
  saveWeekChange: jest.fn(),
};

jest.mock("../plan/usePlanActions", () => ({ usePlanActions: () => mockPlan }));
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
}));
jest.mock("expo-crypto", () => ({ randomUUID: () => "b-new" }));

const squat: WorkoutRecord = {
  id: "squat",
  kind: "strength",
  name: "Back squat",
  description: "",
  minutes: 45,
  targetRpe: null,
  variations: [
    { label: "", items: [{ exercise: "Back squat", dose: { sets: 5, reps: 5, weightKg: 100 } }] },
  ],
  pattern: [0],
  exerciseRestS: 180,
  updatedAt: "t",
};

const plan: Plan = {
  blocks: [{ id: "b1", name: "Winter base", start: "2026-10-05", weeks: 4 }],
  memberships: [
    { id: "m1", workoutId: "squat", blockId: "b1", weekdays: [1, 4], start: "2026-10-05" },
    { id: "m2", workoutId: "squat", blockId: null, weekdays: [2], start: "2026-09-01" },
  ],
  weekChanges: [{ membershipId: "m1", week: 3, variation: 0, item: 0, change: { weightKg: 105 } }],
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("blocks", () => {
  it("makes a new block from a start and a number of weeks, then opens it", async () => {
    await renderWithHang(<BlockFormScreen start="2026-10-05" weeks="6" />);
    expect(screen.getByText("New block")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Name"), " Winter base ");
    await fireEvent.press(screen.getByLabelText("Increase Weeks"));
    await fireEvent.press(screen.getByText("Save"));
    expect(mockPlan.saveBlock).toHaveBeenCalledWith({
      id: "b-new",
      name: "Winter base",
      start: "2026-10-05",
      weeks: 7,
    });
    expect(router.replace).toHaveBeenCalledWith({
      pathname: "/plan/block/[id]",
      params: { id: "b-new" },
    });
  });

  it("adds to the block, and moves a plan outside it in", async () => {
    await renderWithHang(<BlockScreen id="b1" />, hangData(), { workouts: [squat], plan });
    await fireEvent.press(screen.getByText("Add a workout"));
    expect(router.push).toHaveBeenCalledWith({ pathname: "/plan/add", params: { blockId: "b1" } });
    await fireEvent.press(screen.getByLabelText("Move Back squat into this block"));
    expect(mockPlan.saveMembership).toHaveBeenCalledWith({
      id: "m2",
      workoutId: "squat",
      blockId: "b1",
      weekdays: [2],
      start: "2026-10-05",
    });
  });
});

describe("block weeks", () => {
  it("shows what each week changes from the workout as written", async () => {
    await renderWithHang(<LadderScreen id="m1" />, hangData(), { workouts: [squat], plan });
    expect(screen.getByLabelText("Week 3: +5 kg")).toBeTruthy();
    expect(screen.getByLabelText("Week 2: As written")).toBeTruthy();
  });

  it("stores a week's change to any field, counted from the workout as written", async () => {
    await renderWithHang(<LadderScreen id="m1" />, hangData(), { workouts: [squat], plan });
    await fireEvent.press(screen.getByLabelText("Week 3: +5 kg"));
    await fireEvent.press(screen.getByLabelText("Increase Weight"));
    expect(mockPlan.saveWeekChange).toHaveBeenLastCalledWith({
      membershipId: "m1",
      week: 3,
      variation: 0,
      item: 0,
      change: { weightKg: 107.5 },
    });
    await fireEvent.press(screen.getByText("+ Sets"));
    await fireEvent.press(screen.getByLabelText("Decrease Sets"));
    expect(mockPlan.saveWeekChange).toHaveBeenLastCalledWith({
      membershipId: "m1",
      week: 3,
      variation: 0,
      item: 0,
      change: { sets: 4, weightKg: 105 },
    });
  });
});
