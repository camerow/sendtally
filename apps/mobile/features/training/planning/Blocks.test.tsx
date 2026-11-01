import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import { Alert, type AlertButton } from "react-native";
import type { Plan, WorkoutRecord } from "@sendtally/api-client";
import { hangData, readingOrder, renderWithHang } from "../data/renderWithHang";
import { PlanGrid } from "../plan/PlanGrid";
import { planGridRows } from "../plan/planGridRows";
import { BlockFormScreen } from "./BlockFormScreen";
import { NewBlock } from "./NewBlock";
import { BlockScreen } from "./BlockScreen";
import { BlocksList } from "../train/BlocksList";
import { LadderScreen } from "./LadderScreen";

const mockPlan = {
  saveBlock: jest.fn(async () => undefined),
  deleteBlock: jest.fn(),
  saveMembership: jest.fn(),
  deleteMembership: jest.fn(),
  saveWeekChange: jest.fn(),
  copyBlock: jest.fn(async () => true),
  savePlanChange: jest.fn(async () => undefined),
  undoPlanChange: jest.fn(async () => undefined),
  toggleWeekDay: jest.fn(async () => undefined),
};

jest.mock("../plan/usePlanActions", () => ({ usePlanActions: () => mockPlan }));
jest.mock("../../../components/Sheet", () => ({
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? children : null,
}));
jest.mock("expo-router", () => ({
  useFocusEffect: jest.fn(),
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
  planChanges: [],
  membershipDays: [],
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("blocks", () => {
  it("makes a new block as an untitled four-week template and opens it to name", async () => {
    await renderWithHang(<NewBlock />);
    expect(mockPlan.saveBlock).toHaveBeenCalledWith({
      id: "b-new",
      name: "",
      start: null,
      weeks: 4,
      focus: null,
    });
    expect(router.replace).toHaveBeenCalledWith({
      pathname: "/plan/block/[id]",
      params: { id: "b-new", fresh: "1", back: "Train" },
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
    await fireEvent.press(screen.getByLabelText("Add a workout to Winter base"));
    await fireEvent.press(screen.getByLabelText("Add 5x5 strength"));
    expect(mockPlan.saveMembership).toHaveBeenCalledWith(
      expect.objectContaining({ workoutId: "strength-5x5", blockId: "b1", weekdays: [] })
    );
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
    planChanges: [],
    membershipDays: [],
  };

  it("reads the running block: its weeks, how it is going and its workouts", async () => {
    await renderWithHang(<BlockScreen id="b1" />, hangData(), { workouts: [squat], plan: running });
    expect(screen.getByText("Mon, Sep 21 to Sun, Oct 18 · 4 weeks")).toBeTruthy();
    expect(screen.getByText("W4")).toBeTruthy();
    expect(screen.getByText("This week")).toBeTruthy();
    expect(screen.getByText("So far")).toBeTruthy();
    expect(screen.getByText("0 of 4")).toBeTruthy();
    expect(screen.queryByText("Delete block")).toBeNull();
    expect(screen.getByText(/^Week 2 · /)).toBeTruthy();
    expect(screen.getByText("1 exercise")).toBeTruthy();
    expect(screen.getByText("45m")).toBeTruthy();
    expect(screen.queryByLabelText("Remove Back squat from your plan")).toBeNull();
    await fireEvent.press(screen.getByLabelText("Back squat"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/plan/membership/[id]",
      params: { id: "m1", back: "Winter base" },
    });
    await fireEvent.press(screen.getByLabelText("Add a workout to Winter base"));
    expect(screen.getByText("Add workouts")).toBeTruthy();
    await fireEvent.press(screen.getByText("Edit"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/plan/block/edit",
      params: { id: "b1" },
    });
  });
});

describe("block card", () => {
  it("opens a workout in its block, back naming Train", async () => {
    const running: Plan = {
      ...plan,
      blocks: [{ id: "b1", name: "Winter base", start: "2026-09-21", weeks: 4, focus: null }],
    };
    await renderWithHang(<BlocksList />, hangData(), { workouts: [squat], plan: running });
    await fireEvent.press(screen.getAllByLabelText("Back squat")[0]!);
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/plan/membership/[id]",
      params: { id: "m1", back: "Train" },
    });
  });
});

describe("a dated week", () => {
  it("starts its columns on the block's weekday when it starts mid-week", async () => {
    // Wednesday 23 September: week 2 runs Wednesday 30 to Tuesday 6 October.
    const midweek: Plan = {
      ...plan,
      blocks: [{ id: "b1", name: "Winter base", start: "2026-09-23", weeks: 4, focus: null }],
    };
    await renderWithHang(<BlockScreen id="b1" />, hangData(), { workouts: [squat], plan: midweek });
    expect(screen.getByText(/^Week 1 · /)).toBeTruthy();
    expect(readingOrder("28", "29", "23", "24", "25", "26", "27")).toEqual([
      "23",
      "24",
      "25",
      "26",
      "27",
      "28",
      "29",
    ]);
  });
});

describe("a day on a scheduled block", () => {
  // Today is Tuesday 29 September, in week 2 of 4.
  const running: Plan = {
    ...plan,
    blocks: [{ id: "b1", name: "Winter base", start: "2026-09-21", weeks: 4, focus: null }],
    memberships: [
      { id: "m1", workoutId: "squat", blockId: "b1", weekdays: [0, 1], start: "2026-09-21" },
    ],
    weekChanges: [],
  };

  it("sets a workout's days for every week from this one, or for one week alone", async () => {
    await renderWithHang(<LadderScreen id="m1" />, hangData(), {
      workouts: [squat],
      plan: running,
    });
    await fireEvent.press(screen.getByLabelText("Every week, Thursday"));
    expect(mockPlan.toggleWeekDay).toHaveBeenLastCalledWith("m1", {
      week: 2,
      day: 3,
      following: true,
      last: 4,
      every: true,
    });
    await fireEvent.press(screen.getByLabelText("W3, Thursday"));
    expect(mockPlan.toggleWeekDay).toHaveBeenLastCalledWith("m1", {
      week: 3,
      day: 3,
      following: false,
      last: 4,
    });
    expect(screen.getByLabelText("W1, Monday")).not.toHaveProp("accessibilityRole", "checkbox");
  });

  it("opens today's planned day to start, log, move, skip or open", async () => {
    await renderWithHang(<BlockScreen id="b1" />, hangData(), { workouts: [squat], plan: running });
    await fireEvent.press(screen.getByLabelText("Back squat, Tuesday"));
    expect(screen.getByText("Tue · Winter base · W2")).toBeTruthy();
    expect(screen.getByText("Open workout")).toBeTruthy();
    await fireEvent.press(screen.getByText("Skip"));
    expect(screen.getByText("Skip it?")).toBeTruthy();
  });

  it("edits the picked week's days, and the weeks after it once switched on", async () => {
    await renderWithHang(<BlockScreen id="b1" />, hangData(), { workouts: [squat], plan: running });
    await fireEvent.press(screen.getByText("Edit days"));
    await fireEvent.press(screen.getByLabelText("Back squat, Thursday"));
    expect(mockPlan.toggleWeekDay).toHaveBeenLastCalledWith("m1", {
      week: 2,
      day: 3,
      following: false,
      last: 4,
    });
    await fireEvent.press(screen.getByRole("switch", { name: "Also weeks 3 to 4" }));
    await fireEvent.press(screen.getByLabelText("Back squat, Thursday"));
    expect(mockPlan.toggleWeekDay).toHaveBeenLastCalledWith(
      "m1",
      expect.objectContaining({ week: 2, following: true })
    );
    await fireEvent.press(screen.getByText("Done"));
    expect(screen.getByText("Edit days")).toBeTruthy();
  });

  it("marks a skipped day and leaves it out of Done", async () => {
    const skipped: Plan = {
      ...running,
      planChanges: [
        {
          membershipId: "m1",
          plannedOn: "2026-09-29",
          kind: "skip",
          movedTo: null,
          reason: null,
          note: null,
        },
      ],
    };
    await renderWithHang(<LadderScreen id="m1" />, hangData(), {
      workouts: [squat],
      plan: skipped,
    });
    expect(screen.getByText("0/1")).toBeTruthy();
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
      params: { id: "b0", back: "Train" },
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
      params: { id: "m3", back: "Summer base" },
    });
    expect(screen.getByLabelText("Back squat")).toBeTruthy();
    expect(screen.queryByLabelText("Add a workout to Summer base")).toBeNull();
  });

  it("copies a past block from the day picked, its weeks running from that weekday", async () => {
    await renderWithHang(<BlockScreen id="b0" />, hangData(), { workouts: [squat], plan: past });
    await fireEvent.press(screen.getByText("Plan again"));
    expect(screen.getByText("When does it start?")).toBeTruthy();
    expect(
      screen.getByText("Tue, Sep 29 to Mon, Oct 26. Each block week runs Tuesday to Monday.")
    ).toBeTruthy();
    await fireEvent.press(screen.getByText("Schedule from Tue, Sep 29"));
    expect(mockPlan.copyBlock).toHaveBeenCalledWith("b0", "b-new", "2026-09-29");
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
    expect(screen.getByText("Not scheduled")).toBeTruthy();
    expect(screen.queryByText("This week")).toBeNull();
    expect(screen.getByLabelText("Back squat")).toBeTruthy();
    await fireEvent.press(screen.getByText("Schedule"));
    await fireEvent.press(screen.getByText("Schedule from Tue, Sep 29"));
    expect(mockPlan.copyBlock).toHaveBeenCalledWith("t1", "b-new", "2026-09-29");
  });

  it("names the workouts a schedule leaves out for having no days", async () => {
    const some: Plan = {
      ...withTemplate,
      memberships: [
        ...withTemplate.memberships,
        { id: "m10", workoutId: "squat", blockId: "t1", weekdays: [], start: "2026-09-01" },
      ],
    };
    await renderWithHang(<BlockScreen id="t1" />, hangData(), { workouts: [squat], plan: some });
    await fireEvent.press(screen.getByText("Schedule"));
    expect(screen.getByText("Back squat has no days yet and won’t be scheduled.")).toBeTruthy();
  });

  it("saves any block as a template from its ··· menu", async () => {
    await renderWithHang(<BlockScreen id="b1" />, hangData(), { workouts: [squat], plan });
    await fireEvent.press(screen.getByLabelText("More"));
    await fireEvent.press(screen.getByText("Save as template"));
    expect(mockPlan.copyBlock).toHaveBeenCalledWith("b1", "b-new", null);
  });

  it("builds a template in place: its name, its weeks and its workouts' days", async () => {
    const dayless: Plan = {
      ...withTemplate,
      memberships: withTemplate.memberships.map((m) =>
        m.id === "m9" ? { ...m, weekdays: [] } : m
      ),
    };
    await renderWithHang(<BlockScreen id="t1" />, hangData(), {
      workouts: [squat],
      plan: dayless,
    });
    expect(screen.getByRole("button", { name: "Schedule" })).toBeDisabled();
    expect(screen.getByText("Tap the days Back squat runs")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Back squat, Wednesday"));
    expect(mockPlan.toggleWeekDay).toHaveBeenLastCalledWith("m9", {
      week: 1,
      day: 2,
      following: false,
      last: 1,
    });
    await fireEvent.changeText(screen.getByLabelText("Name"), " Peak ");
    await fireEvent(screen.getByLabelText("Name"), "blur");
    expect(mockPlan.saveBlock).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "t1", name: "Peak" })
    );
    await fireEvent.press(screen.getByLabelText("Increase Weeks"));
    expect(mockPlan.saveBlock).toHaveBeenLastCalledWith(expect.objectContaining({ weeks: 7 }));
    expect(screen.queryByText("Edit")).toBeNull();
  });

  it("reads a picked week's numbers, gold where they change", async () => {
    const changed: Plan = {
      ...withTemplate,
      weekChanges: [{ membershipId: "m9", week: 3, dose: 0, item: 0, change: { sets: 3 } }],
    };
    await renderWithHang(<BlockScreen id="t1" />, hangData(), {
      workouts: [squat],
      plan: changed,
    });
    await fireEvent.press(screen.getByLabelText("Week 2"));
    expect(screen.getByText("Week 2 runs as written.")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Week 3"));
    expect(screen.getByText("1 changed")).toBeTruthy();
    expect(
      screen.getByText("Gold is where week 3 differs from as written. Tap a row to change it.")
    ).toBeTruthy();
  });

  it("leaves Done out of a template's weekly load, as nothing has run", async () => {
    await renderWithHang(<LadderScreen id="m9" />, hangData(), {
      workouts: [squat],
      plan: withTemplate,
    });
    expect(screen.getByText("Weekly load")).toBeTruthy();
    expect(screen.queryByText("Done")).toBeNull();
  });

  it("drops an untitled template left with nothing in it", async () => {
    const bare: Plan = {
      ...plan,
      blocks: [{ id: "t2", name: "", start: null, weeks: 4, focus: null }],
    };
    const view = await renderWithHang(<BlockScreen id="t2" />, hangData(), { plan: bare });
    expect(screen.getByText("Add the workouts this block repeats each week.")).toBeTruthy();
    await view.unmount();
    expect(mockPlan.deleteBlock).toHaveBeenCalledWith("t2");
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
    expect(screen.getByText("Back")).toBeTruthy();
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

  it("gives each exercise its own section, saying which weeks change it", async () => {
    const pair: WorkoutRecord = {
      ...squat,
      items: [...squat.items, { exercise: "Deadlift", doses: [{ sets: 3, reps: 5 }] }],
    };
    await renderWithHang(<LadderScreen id="m1" />, hangData(), { workouts: [pair], plan });
    expect(screen.getByText("5 × 5 · 100 kg · changes W3")).toBeTruthy();
    expect(screen.getByText("3 × 5")).toBeTruthy();
    expect(screen.getAllByLabelText("Week 1, Sets")).toHaveLength(1);
    await fireEvent.press(screen.getByText("Open all"));
    expect(screen.getAllByLabelText("Week 1, Sets")).toHaveLength(2);
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
    await renderWithHang(
      <PlanGrid
        rows={planGridRows(plan.memberships, workout, {
          gripName: (id) => id,
          defaultGrip: (w) => w.grip,
          workout: () => undefined,
        })}
      />
    );
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
