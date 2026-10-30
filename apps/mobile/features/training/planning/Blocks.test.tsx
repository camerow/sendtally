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
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), dismiss: jest.fn() },
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
  focus: null,
  updatedAt: "t",
};

const plan: Plan = {
  blocks: [{ id: "b1", name: "Winter base", start: "2026-10-05", weeks: 4, focus: null }],
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
      focus: null,
    });
    expect(router.replace).toHaveBeenCalledWith({
      pathname: "/plan/block/[id]",
      params: { id: "b-new" },
    });
  });

  it("edits a block's workouts in place, saving the rest on Save", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    await renderWithHang(<BlockFormScreen id="b1" />, hangData(), { workouts: [squat], plan });
    expect(screen.getByText("Edit block")).toBeTruthy();
    expect(screen.getByText("Workout changes save as you make them.")).toBeTruthy();
    await fireEvent.press(screen.getByText("Back squat"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/plan/membership/[id]",
      params: { id: "m1" },
    });
    await fireEvent.press(screen.getByLabelText("Remove Back squat from your plan"));
    const buttons = alert.mock.calls[0]?.[2] as AlertButton[];
    buttons.find((b) => b.style === "destructive")?.onPress?.();
    expect(mockPlan.deleteMembership).toHaveBeenCalledWith("m1");
    expect(mockPlan.saveBlock).not.toHaveBeenCalled();
    await fireEvent.changeText(screen.getByLabelText("Name"), "Winter power");
    await fireEvent.press(screen.getByText("Save"));
    expect(mockPlan.saveBlock).toHaveBeenCalledWith(
      expect.objectContaining({ id: "b1", name: "Winter power" })
    );
    expect(router.back).toHaveBeenCalled();
  });

  it("adds a workout from the editor and comes back to it", async () => {
    await renderWithHang(<BlockFormScreen id="b1" />, hangData(), { workouts: [squat], plan });
    await fireEvent.press(screen.getByText("Add a workout"));
    await fireEvent.press(screen.getAllByText("Strength").at(-1)!);
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/plan/add",
      params: { blockId: "b1", editing: "1", kind: "strength" },
    });
  });

  it("edits the block without a Delete: that lives in its screen's menu", async () => {
    await renderWithHang(<BlockFormScreen id="b1" />, hangData(), { workouts: [squat], plan });
    expect(screen.queryByText("Delete block")).toBeNull();
  });

  it("deletes the block from its ··· menu, once confirmed, then goes back", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    await renderWithHang(<BlockScreen id="b1" />, hangData(), { workouts: [squat], plan });
    await fireEvent.press(screen.getByLabelText("More"));
    expect(screen.getAllByText("Its plans go with it. What you logged stays.")).toHaveLength(1);
    await fireEvent.press(screen.getByText("Delete block"));
    expect(alert.mock.calls[0]?.[0]).toBe("Delete Winter base?");
    expect(mockPlan.deleteBlock).not.toHaveBeenCalled();
    const buttons = alert.mock.calls[0]?.[2] as AlertButton[];
    buttons.find((b) => b.style === "destructive")?.onPress?.();
    expect(mockPlan.deleteBlock).toHaveBeenCalledWith("b1");
    expect(router.back).toHaveBeenCalled();
  });
});

describe("block overview", () => {
  // Today is Tuesday 29 September, in week 2 of 4.
  const running: Plan = {
    ...plan,
    blocks: [{ id: "b1", name: "Winter base", start: "2026-09-21", weeks: 4, focus: null }],
    memberships: [
      { id: "m1", workoutId: "squat", blockId: "b1", weekdays: [0, 1], start: "2026-09-21" },
    ],
    weekChanges: [],
  };

  it("reads the running block: its weeks, how it is going and its workouts", async () => {
    await renderWithHang(<BlockScreen id="b1" />, hangData(), { workouts: [squat], plan: running });
    expect(screen.getByText("Mon, Sep 21 to Sun, Oct 18 · 4 weeks")).toBeTruthy();
    expect(screen.getByText("W4")).toBeTruthy();
    expect(screen.getByText("This week")).toBeTruthy();
    expect(screen.getByText("So far")).toBeTruthy();
    expect(screen.getByText("0 of 4")).toBeTruthy();
    expect(screen.queryByText("Delete block")).toBeNull();
    expect(screen.getByText("Your week")).toBeTruthy();
    expect(screen.getByText("1 exercise")).toBeTruthy();
    expect(screen.getByText("45m")).toBeTruthy();
    expect(screen.queryByLabelText("Remove Back squat from your plan")).toBeNull();
    await fireEvent.press(screen.getByLabelText("Back squat"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/plan/membership/[id]",
      params: { id: "m1" },
    });
    await fireEvent.press(screen.getByLabelText("Add to Winter base"));
    expect(screen.getByText("What kind?")).toBeTruthy();
    await fireEvent.press(screen.getByText("Edit"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/plan/block/edit",
      params: { id: "b1" },
    });
  });
});

describe("plan again", () => {
  const past: Plan = {
    ...plan,
    blocks: [
      ...plan.blocks,
      { id: "b0", name: "Summer base", start: "2026-08-03", weeks: 4, focus: null },
    ],
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

  it("recaps a finished block: done, missed, its weeks and each workout", async () => {
    await renderWithHang(<BlockScreen id="b0" />, hangData(), { workouts: [squat], plan: past });
    expect(screen.getByText("Finished")).toBeTruthy();
    expect(screen.getByText("0 of 4")).toBeTruthy();
    expect(screen.getByText("Missed")).toBeTruthy();
    expect(screen.getAllByText("0/1")).toHaveLength(4);
    expect(screen.getByText("W1")).toBeTruthy();
    expect(screen.getByText("0 of 4 done · -")).toBeTruthy();
    await fireEvent.press(screen.getByText("0 of 4 done · -"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/plan/membership/[id]",
      params: { id: "m3" },
    });
    expect(screen.getByLabelText("Back squat")).toBeTruthy();
  });

  it("copies a past block from the week picked, then opens the copy", async () => {
    await renderWithHang(<BlockScreen id="b0" />, hangData(), { workouts: [squat], plan: past });
    await fireEvent.press(screen.getByText("Plan again"));
    const [sheet, footer] = screen.getAllByText("Plan again");
    expect(footer).toBeTruthy();
    await fireEvent.press(sheet!);
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

describe("templates", () => {
  const withTemplate: Plan = {
    ...plan,
    blocks: [
      ...plan.blocks,
      { id: "t1", name: "Base to peak", start: null, weeks: 6, focus: null },
    ],
    memberships: [
      ...plan.memberships,
      { id: "m9", workoutId: "squat", blockId: "t1", weekdays: [0], start: "2026-09-01" },
    ],
  };

  it("lists templates between upcoming and past blocks", async () => {
    await renderWithHang(<BlocksList />, hangData(), { workouts: [squat], plan: withTemplate });
    expect(screen.getByText("Templates")).toBeTruthy();
    expect(screen.getByText("6 weeks · 1 workout")).toBeTruthy();
  });

  it("opens a template with its weeks and workouts, and schedules a copy", async () => {
    await renderWithHang(<BlockScreen id="t1" />, hangData(), {
      workouts: [squat],
      plan: withTemplate,
    });
    expect(screen.getByText("Template")).toBeTruthy();
    expect(screen.getByText("6 weeks · not scheduled")).toBeTruthy();
    expect(screen.queryByText("This week")).toBeNull();
    expect(screen.getByLabelText("Back squat")).toBeTruthy();
    await fireEvent.press(screen.getByText("Schedule"));
    await fireEvent.press(screen.getAllByText("Schedule")[0]!);
    expect(mockPlan.copyBlock).toHaveBeenCalledWith("t1", "b-new", "2026-09-28");
  });

  it("saves any block as a template from its ··· menu", async () => {
    await renderWithHang(<BlockScreen id="b1" />, hangData(), { workouts: [squat], plan });
    await fireEvent.press(screen.getByLabelText("More"));
    await fireEvent.press(screen.getByText("Save as template"));
    expect(mockPlan.copyBlock).toHaveBeenCalledWith("b1", "b-new", null);
  });

  it("saves a new block with no start as a template", async () => {
    await renderWithHang(<BlockFormScreen />, hangData(), { workouts: [squat], plan });
    await fireEvent.changeText(screen.getByLabelText("Name"), "Base to peak");
    await fireEvent.press(screen.getByLabelText(/^Starts, /));
    await fireEvent.press(screen.getByText("No start date, keep it as a template"));
    expect(screen.getByText("not scheduled")).toBeTruthy();
    await fireEvent.press(screen.getByText("Save"));
    expect(mockPlan.saveBlock).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Base to peak", start: null })
    );
  });
});

describe("block weeks", () => {
  it("lays the weeks out as a table, gold where a week differs from as written", async () => {
    await renderWithHang(<LadderScreen id="m1" />, hangData(), { workouts: [squat], plan });
    expect(screen.getByText("Weekly load")).toBeTruthy();
    expect(screen.getByLabelText("Week 3, Weight")).toHaveProp("accessibilityValue", {
      text: "105",
    });
    expect(screen.getByLabelText("Week 2, Weight")).toHaveProp("accessibilityValue", {
      text: "100",
    });
    expect(screen.getByText("Winter base")).toBeTruthy();
  });

  it("stores a week's change from its cell, Next walking down the column", async () => {
    await renderWithHang(<LadderScreen id="m1" />, hangData(), { workouts: [squat], plan });
    await fireEvent.press(screen.getByLabelText("Week 2, Weight"));
    expect(screen.getByText("As written 100")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Add 2.5"));
    await fireEvent.press(screen.getByText("Next"));
    expect(mockPlan.saveWeekChange).toHaveBeenLastCalledWith({
      membershipId: "m1",
      week: 2,
      dose: 0,
      item: 0,
      change: { weightKg: 102.5 },
    });
    expect(screen.getByLabelText("Week 3, Weight")).toHaveProp("accessibilityState", {
      expanded: true,
    });
  });

  it("resets a changed week to as written", async () => {
    await renderWithHang(<LadderScreen id="m1" />, hangData(), { workouts: [squat], plan });
    await fireEvent.press(screen.getByLabelText("Week 3, Weight"));
    await fireEvent.press(screen.getByText("Reset"));
    expect(mockPlan.saveWeekChange).toHaveBeenLastCalledWith({
      membershipId: "m1",
      week: 3,
      dose: 0,
      item: 0,
      change: {},
    });
  });

  it("adds a column the dose does not show yet", async () => {
    await renderWithHang(<LadderScreen id="m1" />, hangData(), { workouts: [squat], plan });
    expect(screen.queryByLabelText("Week 1, Set rest")).toBeNull();
    await fireEvent.press(screen.getByText("+ Column"));
    await fireEvent.press(screen.getByText("Set rest"));
    expect(screen.getByLabelText("Week 1, Set rest")).toBeTruthy();
  });

  it("takes a workout out of its block from its ··· menu, once confirmed", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    await renderWithHang(<LadderScreen id="m1" />, hangData(), { workouts: [squat], plan });
    await fireEvent.press(screen.getByLabelText("More"));
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
    await renderWithHang(<PlanGrid rows={planGridRows(plan.memberships, workout, (id) => id)} />);
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
