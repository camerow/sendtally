import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import { Alert, type AlertButton } from "react-native";
import type { Plan, WorkoutRecord } from "@sendtally/api-client";
import { hangData, renderWithHang } from "../data/renderWithHang";
import { PlanGrid } from "../plan/PlanGrid";
import { planGridRows } from "../plan/planGridRows";
import { BlockFormScreen } from "./BlockFormScreen";
import { BlockScreen } from "./BlockScreen";
import { BlocksList } from "../train/BlocksList";
import { LadderScreen } from "./LadderScreen";

const mockPlan = {
  saveBlock: jest.fn(),
  deleteBlock: jest.fn(),
  saveMembership: jest.fn(),
  deleteMembership: jest.fn(),
  saveWeekChange: jest.fn(),
  copyBlock: jest.fn(async () => true),
};

jest.mock("../plan/usePlanActions", () => ({ usePlanActions: () => mockPlan }));
jest.mock("../../../components/Sheet", () => ({
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? children : null,
}));
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
  items: [{ exercise: "Back squat", doses: [{ sets: 5, reps: 5, weightKg: 100 }] }],
  exerciseRestS: 180,
  updatedAt: "t",
};

const plan: Plan = {
  blocks: [{ id: "b1", name: "Winter base", start: "2026-10-05", weeks: 4 }],
  memberships: [
    { id: "m1", workoutId: "squat", blockId: "b1", weekdays: [1, 4], start: "2026-10-05" },
    { id: "m2", workoutId: "squat", blockId: null, weekdays: [2], start: "2026-09-01" },
  ],
  weekChanges: [{ membershipId: "m1", week: 3, dose: 0, item: 0, change: { weightKg: 105 } }],
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("blocks", () => {
  it("makes a new block from today for four weeks, then opens it", async () => {
    await renderWithHang(<BlockFormScreen />);
    expect(screen.getByText("New block")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Name"), " Winter base ");
    await fireEvent.press(screen.getByLabelText("Increase Weeks"));
    await fireEvent.press(screen.getByText("Save"));
    expect(mockPlan.saveBlock).toHaveBeenCalledWith({
      id: "b-new",
      name: "Winter base",
      start: "2026-09-29",
      weeks: 5,
    });
    expect(router.replace).toHaveBeenCalledWith({
      pathname: "/plan/block/[id]",
      params: { id: "b-new" },
    });
  });

  it("adds to the block, and moves a plan outside it in", async () => {
    await renderWithHang(<BlockScreen id="b1" />, hangData(), { workouts: [squat], plan });
    await fireEvent.press(screen.getByText("Add a workout"));
    await fireEvent.press(screen.getByText("Strength"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/plan/add",
      params: { blockId: "b1", kind: "strength" },
    });
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

describe("plan again", () => {
  const past: Plan = {
    ...plan,
    blocks: [...plan.blocks, { id: "b0", name: "Summer base", start: "2026-08-03", weeks: 4 }],
    memberships: [
      ...plan.memberships,
      { id: "m3", workoutId: "squat", blockId: "b0", weekdays: [0], start: "2026-08-03" },
    ],
  };

  it("lists the blocks: plans with no block, then upcoming and past", async () => {
    await renderWithHang(<BlocksList />, hangData(), { workouts: [squat], plan: past });
    expect(screen.getByText("Ongoing")).toBeTruthy();
    expect(screen.getByText("Starts Mon, Oct 5 · 4 weeks")).toBeTruthy();
    expect(screen.getByText("4 weeks · 0 of 4 done")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Open Summer base"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/plan/block/[id]",
      params: { id: "b0" },
    });
  });

  it("copies a past block from the week picked, then opens the copy", async () => {
    await renderWithHang(<BlockScreen id="b0" />, hangData(), { workouts: [squat], plan: past });
    await fireEvent.press(screen.getByText("Plan again"));
    const buttons = screen.getAllByText("Plan again");
    await fireEvent.press(buttons[buttons.length - 1]!);
    expect(mockPlan.copyBlock).toHaveBeenCalledWith("b0", "b-new", "2026-09-28");
    expect(router.replace).toHaveBeenCalledWith({
      pathname: "/plan/block/[id]",
      params: { id: "b-new" },
    });
  });

  it("offers it only once the block is over", async () => {
    await renderWithHang(<BlockScreen id="b1" />, hangData(), { workouts: [squat], plan });
    expect(screen.queryByText("Plan again")).toBeNull();
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
      dose: 0,
      item: 0,
      change: { weightKg: 107.5 },
    });
    await fireEvent.press(screen.getByText("+ Sets"));
    await fireEvent.press(screen.getByLabelText("Decrease Sets"));
    expect(mockPlan.saveWeekChange).toHaveBeenLastCalledWith({
      membershipId: "m1",
      week: 3,
      dose: 0,
      item: 0,
      change: { sets: 4, weightKg: 105 },
    });
  });

  it("takes a workout out of its block from its weeks, once confirmed", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    await renderWithHang(<LadderScreen id="m1" />, hangData(), { workouts: [squat], plan });
    await fireEvent.press(screen.getByText("Remove from block"));
    expect(mockPlan.deleteMembership).not.toHaveBeenCalled();
    const buttons = alert.mock.calls[0]?.[2] as AlertButton[];
    buttons.find((b) => b.style === "destructive")?.onPress?.();
    expect(mockPlan.deleteMembership).toHaveBeenCalledWith("m1");
    expect(router.back).toHaveBeenCalled();
  });
});

describe("week grid", () => {
  it("opens a plan's weeks inside a block and its workout outside one", async () => {
    const workout = (id: string): WorkoutRecord | undefined => (id === "squat" ? squat : undefined);
    await renderWithHang(<PlanGrid rows={planGridRows(plan.memberships, workout)} />);
    const [inBlock, outside] = screen.getAllByLabelText("Back squat");
    await fireEvent.press(inBlock!);
    expect(router.push).toHaveBeenLastCalledWith({
      pathname: "/plan/membership/[id]",
      params: { id: "m1" },
    });
    await fireEvent.press(outside!);
    expect(router.push).toHaveBeenLastCalledWith({
      pathname: "/workout/[id]",
      params: { id: "squat" },
    });
  });
});
