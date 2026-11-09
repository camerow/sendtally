import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import { Alert, Text, type AlertButton } from "react-native";
import type { Plan, WorkoutRecord } from "@sendtally/api-client";
import type { PlanDraft } from "@sendtally/features/training";
import { hangData, readingOrder, renderWithHang } from "../data/renderWithHang";
import { PlanGrid } from "../plan/PlanGrid";
import { planGridRows } from "../plan/planGridRows";
import { useNewBlock } from "./useNewBlock";
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
  saveDraft: jest.fn(async (_draft: PlanDraft) => undefined),
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
    {
      id: "m1",
      workoutId: "squat",
      blockId: "b1",
      weekdays: [1, 4],
      start: "2026-10-05",
      position: 0,
    },
    {
      id: "m2",
      workoutId: "squat",
      blockId: null,
      weekdays: [2],
      start: "2026-09-01",
      position: 0,
    },
  ],
  weekChanges: [{ membershipId: "m1", week: 3, dose: 0, itemId: "0", change: { weightKg: 105 } }],
  planChanges: [],
  membershipDays: [],
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("blocks", () => {
  it("makes a new block as an untitled four-week template and opens it at once to name", async () => {
    const NewBlock = (): React.ReactElement => {
      const make = useNewBlock("Train");
      return <Text onPress={make}>New block</Text>;
    };
    await renderWithHang(<NewBlock />);
    await fireEvent.press(screen.getByText("New block"));
    expect(mockPlan.saveBlock).toHaveBeenCalledWith({
      id: "b-new",
      name: "",
      start: null,
      weeks: 4,
      focus: null,
    });
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/plan/block/[id]",
      params: { id: "b-new", fresh: "1", back: "Train" },
    });
  });

  it("reads a block until Edit, then saves its name, weeks and first day together", async () => {
    await renderWithHang(<BlockScreen id="b1" />, hangData(), { workouts: [squat], plan });
    expect(screen.getByText("Scheduled")).toBeTruthy();
    expect(screen.queryByLabelText("Name")).toBeNull();
    expect(screen.queryByLabelText("Decrease Weeks")).toBeNull();
    await fireEvent.press(screen.getByText("Edit"));
    expect(screen.getByText("Edit block")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Name"), " Winter power ");
    await fireEvent.press(screen.getByLabelText("Decrease Weeks"));
    await fireEvent.press(screen.getByLabelText("Reschedule the first day"));
    await fireEvent.press(screen.getAllByLabelText(/Oct 6/)[0]!);
    await fireEvent.press(screen.getByText("Start on Tue, Oct 6"));
    expect(screen.getByText("Tue, Oct 6 to Mon, Oct 26")).toBeTruthy();
    expect(mockPlan.saveBlock).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByText("Save"));
    expect(mockPlan.saveDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        block: { id: "b1", name: "Winter power", start: "2026-10-06", weeks: 3, focus: null },
      })
    );
    expect(screen.getByText("Edit")).toBeTruthy();
  });

  it("orders a block's workouts in Edit, saved with the rest and dropped on Cancel", async () => {
    const hang = { ...squat, id: "hang", kind: "hangboard" as const, name: "Max hangs" };
    const two: Plan = {
      ...plan,
      memberships: [
        ...plan.memberships,
        {
          id: "m3",
          workoutId: "hang",
          blockId: "b1",
          weekdays: [3],
          start: "2026-10-05",
          position: 1,
        },
      ],
    };
    await renderWithHang(<BlockScreen id="b1" />, hangData(), {
      workouts: [squat, hang],
      plan: two,
    });
    expect(screen.queryByText("Order")).toBeNull();
    await fireEvent.press(screen.getByText("Edit"));
    expect(screen.getByLabelText("Move Back squat up")).toBeDisabled();
    expect(screen.getByLabelText("Move Max hangs down")).toBeDisabled();
    await fireEvent.press(screen.getByLabelText("Move Max hangs up"));
    expect(screen.getByLabelText("Move Max hangs up")).toBeDisabled();
    await fireEvent.press(screen.getByText("Cancel"));
    expect(mockPlan.saveDraft).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByText("Edit"));
    expect(screen.getByLabelText("Move Back squat up")).toBeDisabled();
    await fireEvent.press(screen.getByLabelText("Move Back squat down"));
    await fireEvent.press(screen.getByText("Save"));
    expect(mockPlan.saveDraft).toHaveBeenCalledWith(
      expect.objectContaining({ order: ["m3", "m1"] })
    );
  });

  it("keeps a scheduled block's name when the field is emptied, and drops edits on Cancel", async () => {
    await renderWithHang(<BlockScreen id="b1" />, hangData(), { workouts: [squat], plan });
    await fireEvent.press(screen.getByText("Edit"));
    await fireEvent.changeText(screen.getByLabelText("Name"), "  ");
    await fireEvent(screen.getByLabelText("Name"), "blur");
    expect(screen.getByLabelText("Name")).toHaveProp("value", "Winter base");
    await fireEvent.press(screen.getByLabelText("Increase Weeks"));
    await fireEvent.press(screen.getByText("Cancel"));
    expect(screen.getByText("Mon, Oct 5 to Sun, Nov 1")).toBeTruthy();
    expect(mockPlan.saveDraft).not.toHaveBeenCalled();
  });

  it("keeps a running block's weeks to no fewer than it has run, and its first day", async () => {
    const running: Plan = {
      ...plan,
      blocks: [{ id: "b1", name: "Winter base", start: "2026-09-21", weeks: 2, focus: null }],
    };
    await renderWithHang(<BlockScreen id="b1" />, hangData(), { workouts: [squat], plan: running });
    await fireEvent.press(screen.getByText("Edit"));
    expect(screen.getByLabelText("Decrease Weeks")).toBeDisabled();
    expect(screen.queryByLabelText("Move the first day")).toBeNull();
  });

  it("deletes the block from its ··· menu, once confirmed, then goes back", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    await renderWithHang(<BlockScreen id="b1" />, hangData(), { workouts: [squat], plan });
    await fireEvent.press(screen.getByLabelText("More"));
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
      {
        id: "m1",
        workoutId: "squat",
        blockId: "b1",
        weekdays: [0, 1],
        start: "2026-09-21",
        position: 0,
      },
    ],
    weekChanges: [],
    planChanges: [],
    membershipDays: [],
  };

  it("reads the running block: its weeks, how it is going and its workouts", async () => {
    await renderWithHang(<BlockScreen id="b1" />, hangData(), { workouts: [squat], plan: running });
    expect(screen.getByText("Mon, Sep 21 to Sun, Oct 18")).toBeTruthy();
    expect(screen.getByText("W4")).toBeTruthy();
    expect(screen.getByText("This week")).toBeTruthy();
    expect(screen.getByText("So far")).toBeTruthy();
    expect(screen.getByText("0 of 4")).toBeTruthy();
    expect(screen.queryByText("Delete block")).toBeNull();
    expect(screen.getAllByText("Week 2").length).toBeGreaterThan(0);
    await fireEvent.press(screen.getByLabelText("Next week"));
    expect(screen.getAllByText("Week 3").length).toBeGreaterThan(0);
    await fireEvent.press(screen.getByLabelText("Previous week"));
    expect(screen.getByText("1 exercise")).toBeTruthy();
    expect(screen.getByText("45m")).toBeTruthy();
    expect(screen.queryByLabelText("Remove Back squat from your plan")).toBeNull();
    await fireEvent.press(screen.getByLabelText("Back squat"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/plan/membership/[id]",
      params: { id: "m1", back: "Winter base" },
    });
    expect(screen.queryByLabelText("Add a workout to Winter base")).toBeNull();
    await fireEvent.press(screen.getByText("Edit"));
    await fireEvent.press(screen.getByLabelText("Add a workout to Winter base"));
    expect(screen.getByText("Add workouts")).toBeTruthy();
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
      {
        id: "m1",
        workoutId: "squat",
        blockId: "b1",
        weekdays: [0, 1],
        start: "2026-09-21",
        position: 0,
      },
    ],
    weekChanges: [],
  };

  it("sets a workout's days for every week from this one, or for one week alone", async () => {
    await renderWithHang(<LadderScreen id="m1" />, hangData(), {
      workouts: [squat],
      plan: running,
    });
    expect(screen.queryByLabelText("Every week, Thursday")).toBeNull();
    await fireEvent.press(screen.getByText("Edit"));
    expect(screen.getByText("Edit workout in Winter base")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Every week, Thursday"));
    await fireEvent.press(screen.getByLabelText("Week 3, Friday"));
    expect(screen.getByLabelText("Week 1, Monday")).not.toHaveProp("accessibilityRole", "checkbox");
    await fireEvent.press(screen.getByText("Save"));
    const draft = mockPlan.saveDraft.mock.calls[0]?.[0];
    expect(draft?.schedules[0]?.weeks).toEqual([
      { membershipId: "m1", fromWeek: 2, weekdays: [0, 1, 3] },
      { membershipId: "m1", fromWeek: 3, weekdays: [0, 1, 3, 4] },
      { membershipId: "m1", fromWeek: 4, weekdays: [0, 1, 3] },
    ]);
  });

  it("opens today's planned day to start, log, move, skip or open", async () => {
    await renderWithHang(<BlockScreen id="b1" />, hangData(), { workouts: [squat], plan: running });
    await fireEvent.press(screen.getByLabelText("Back squat, Tuesday"));
    expect(screen.getByText("Week 2 · Tue, Sep 29")).toBeTruthy();
    await fireEvent.press(screen.getByText("Skip"));
    expect(screen.getByText("Skip it?")).toBeTruthy();
  });

  it("opens the workout in its block from the day's title", async () => {
    await renderWithHang(<BlockScreen id="b1" />, hangData(), { workouts: [squat], plan: running });
    await fireEvent.press(screen.getByLabelText("Back squat, Tuesday"));
    await fireEvent.press(screen.getByRole("link"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/plan/membership/[id]",
      params: { id: "m1", back: "Winter base" },
    });
  });

  it("edits the picked week's days, and the weeks after it once switched on", async () => {
    await renderWithHang(<BlockScreen id="b1" />, hangData(), { workouts: [squat], plan: running });
    await fireEvent.press(screen.getByText("Edit"));
    await fireEvent.press(screen.getByLabelText("Back squat, Thursday"));
    await fireEvent.press(screen.getByRole("switch", { name: "Apply to following weeks" }));
    await fireEvent.press(screen.getByLabelText("Back squat, Saturday"));
    await fireEvent.press(screen.getByText("Save"));
    const draft = mockPlan.saveDraft.mock.calls[0]?.[0];
    expect(draft?.schedules[0]?.weeks).toEqual([
      { membershipId: "m1", fromWeek: 2, weekdays: [0, 1, 3, 5] },
    ]);
    expect(screen.getByText("Edit")).toBeTruthy();
  });

  it("applies the week to the following weeks as it is switched on, and takes it back off", async () => {
    await renderWithHang(<BlockScreen id="b1" />, hangData(), { workouts: [squat], plan: running });
    await fireEvent.press(screen.getByText("Edit"));
    await fireEvent.press(screen.getByLabelText("Back squat, Thursday"));
    const following = (): ReturnType<typeof screen.getByRole> =>
      screen.getByRole("switch", { name: "Apply to following weeks" });
    await fireEvent.press(following());
    await fireEvent.press(following());
    await fireEvent.press(screen.getByText("Save"));
    expect(mockPlan.saveDraft.mock.calls[0]?.[0]?.schedules[0]?.weeks).toEqual([
      { membershipId: "m1", fromWeek: 2, weekdays: [0, 1, 3] },
      { membershipId: "m1", fromWeek: 3, weekdays: [0, 1] },
    ]);
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
      {
        id: "m3",
        workoutId: "squat",
        blockId: "b0",
        weekdays: [0],
        start: "2026-08-03",
        position: 0,
      },
    ],
  };

  it("with nothing planned, shows only the empty panel", async () => {
    const none: Plan = { ...plan, blocks: [], memberships: [] };
    await renderWithHang(<BlocksList />, hangData(), { workouts: [squat], plan: none });
    expect(screen.getByText(/^Nothing planned yet/)).toBeTruthy();
    for (const section of ["Active", "Upcoming", "Templates", "Completed"])
      expect(screen.queryByText(section)).toBeNull();
  });

  it("lists the blocks: what is active, then upcoming and completed", async () => {
    await renderWithHang(<BlocksList />, hangData(), { workouts: [squat], plan: past });
    for (const section of ["Active", "Ongoing", "Upcoming", "Completed"])
      expect(screen.getByText(section)).toBeTruthy();
    expect(screen.queryByText("Your week")).toBeNull();
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
      {
        id: "m9",
        workoutId: "squat",
        blockId: "t1",
        weekdays: [0],
        start: "2026-09-01",
        position: 0,
      },
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
        {
          id: "m10",
          workoutId: "squat",
          blockId: "t1",
          weekdays: [],
          start: "2026-09-01",
          position: 0,
        },
      ],
    };
    await renderWithHang(<BlockScreen id="t1" />, hangData(), { workouts: [squat], plan: some });
    await fireEvent.press(screen.getByText("Schedule"));
    expect(screen.getByText("Back squat has no days yet and won’t be scheduled.")).toBeTruthy();
  });

  it("offers no Save as template on a template", async () => {
    await renderWithHang(<BlockScreen id="t1" />, hangData(), {
      workouts: [squat],
      plan: withTemplate,
    });
    await fireEvent.press(screen.getByLabelText("More"));
    expect(screen.getByText("Delete block")).toBeTruthy();
    expect(screen.queryByText("Save as template")).toBeNull();
  });

  it("saves any block as a named template from its ··· menu, and stays on the block", async () => {
    await renderWithHang(<BlockScreen id="b1" />, hangData(), { workouts: [squat], plan });
    await fireEvent.press(screen.getByLabelText("More"));
    await fireEvent.press(screen.getByText("Save as template"));
    expect(mockPlan.copyBlock).not.toHaveBeenCalled();
    await fireEvent.changeText(screen.getByLabelText("Name"), "Base again");
    await fireEvent.press(screen.getByText("Save template"));
    expect(mockPlan.copyBlock).toHaveBeenCalledWith("b1", "b-new", null);
    expect(mockPlan.saveBlock).toHaveBeenCalledWith(
      expect.objectContaining({ id: "b-new", start: null, name: "Base again" })
    );
    expect(router.push).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByText("View"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/plan/block/[id]",
      params: { id: "b-new", back: expect.any(String) },
    });
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
    await fireEvent.press(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByText("Tap the days Back squat runs")).toBeTruthy();
    expect(screen.queryByText("Schedule")).toBeNull();
    await fireEvent.press(screen.getByLabelText("Back squat, Wednesday"));
    await fireEvent.changeText(screen.getByLabelText("Name"), " Peak ");
    await fireEvent.press(screen.getByLabelText("Increase Weeks"));
    await fireEvent.press(screen.getByText("Save"));
    expect(mockPlan.saveDraft).toHaveBeenCalledWith({
      block: { id: "t1", name: "Peak", start: null, weeks: 7, focus: null },
      schedules: [
        {
          membershipId: "m9",
          weekdays: [],
          weeks: [
            { membershipId: "m9", fromWeek: 1, weekdays: [2] },
            { membershipId: "m9", fromWeek: 2, weekdays: [] },
          ],
        },
      ],
      weekChanges: [],
      order: [],
    });
  });

  it("opens a new template in Edit mode with its name being typed", async () => {
    await renderWithHang(<BlockScreen id="t1" fresh />, hangData(), {
      workouts: [squat],
      plan: withTemplate,
    });
    expect(screen.getByLabelText("Name")).toHaveProp("autoFocus", true);
    await fireEvent.press(screen.getByText("Save"));
    expect(screen.getByText("Edit")).toBeTruthy();
  });

  it("reads a picked week's numbers, gold where they change", async () => {
    const changed: Plan = {
      ...withTemplate,
      weekChanges: [{ membershipId: "m9", week: 3, dose: 0, itemId: "0", change: { sets: 3 } }],
    };
    await renderWithHang(<BlockScreen id="t1" />, hangData(), {
      workouts: [squat],
      plan: changed,
    });
    await fireEvent.press(screen.getByLabelText("Week 3"));
    expect(screen.getByText("1 changed")).toBeTruthy();
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
    expect(screen.getByText("105")).toBeTruthy();
    expect(screen.queryByLabelText("Week 3, Weight")).toBeNull();
    await fireEvent.press(screen.getByText("Edit"));
    expect(screen.getByLabelText("Week 3, Weight")).toHaveProp("accessibilityValue", {
      text: "105",
    });
    expect(screen.getByLabelText("Week 2, Weight")).toHaveProp("accessibilityValue", {
      text: "100",
    });
    expect(screen.getByText("Cancel")).toBeTruthy();
  });

  it("stores a week's change from its cell, Next walking down the column", async () => {
    await renderWithHang(<LadderScreen id="m1" />, hangData(), { workouts: [squat], plan });
    await fireEvent.press(screen.getByText("Edit"));
    await fireEvent.press(screen.getByLabelText("Week 2, Weight"));
    expect(screen.getByText("As written 100")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Add 2.5"));
    await fireEvent.press(screen.getByText("Next"));
    expect(screen.getByLabelText("Week 3, Weight")).toHaveProp("accessibilityState", {
      expanded: true,
    });
    expect(mockPlan.saveWeekChange).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByText("Save"));
    expect(mockPlan.saveDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        weekChanges: [
          { membershipId: "m1", week: 2, dose: 0, itemId: "0", change: { weightKg: 102.5 } },
        ],
      })
    );
  });

  it("resets a changed week to as written", async () => {
    await renderWithHang(<LadderScreen id="m1" />, hangData(), { workouts: [squat], plan });
    await fireEvent.press(screen.getByText("Edit"));
    await fireEvent.press(screen.getByLabelText("Week 3, Weight"));
    await fireEvent.press(screen.getByText("Reset"));
    await fireEvent.press(screen.getByText("Save"));
    expect(mockPlan.saveDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        weekChanges: [{ membershipId: "m1", week: 3, dose: 0, itemId: "0", change: {} }],
      })
    );
  });

  it("gives each exercise its own section, saying which weeks change it", async () => {
    const pair: WorkoutRecord = {
      ...squat,
      items: [...squat.items, { exercise: "Deadlift", doses: [{ sets: 3, reps: 5 }] }],
    };
    await renderWithHang(<LadderScreen id="m1" />, hangData(), { workouts: [pair], plan });
    expect(screen.getByText("5 × 5 · 100 kg · changes W3")).toBeTruthy();
    expect(screen.getByText("3 × 5")).toBeTruthy();
    await fireEvent.press(screen.getByText("Edit"));
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
