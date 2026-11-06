import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import type { Plan, WorkoutRecord } from "@sendtally/api-client";
import { aHang, renderWithHang, hangData } from "../data/renderWithHang";
import { TodayScreen } from "./TodayScreen";

jest.mock("../../../components/Sheet", () => ({
  Sheet: ({
    visible,
    children,
    footer,
  }: {
    visible: boolean;
    children: React.ReactNode;
    footer?: React.ReactNode;
  }) =>
    visible ? (
      <>
        {children}
        {footer}
      </>
    ) : null,
}));
jest.mock("expo-crypto", () => ({ randomUUID: () => "b-new" }));
let mockParams: Record<string, string> = {};

const mockPlanActions = {
  savePlanChange: jest.fn(async () => undefined),
  undoPlanChange: jest.fn(async () => undefined),
  deleteMembership: jest.fn(async () => undefined),
  copyBlock: jest.fn(async () => true),
};
jest.mock("../plan/usePlanActions", () => ({ usePlanActions: () => mockPlanActions }));
jest.mock("expo-router", () => ({
  useFocusEffect: jest.fn(),
  router: { push: jest.fn() },
  useLocalSearchParams: () => mockParams,
  useNavigation: () => ({ addListener: () => () => undefined }),
}));

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

// Mondays and Tuesdays; today is Tuesday 29 September.
const plan = (workoutId: string, weekdays: (0 | 1)[] = [0, 1]): Plan => ({
  blocks: [],
  memberships: [{ id: "m1", workoutId, blockId: null, weekdays, start: "2026-09-28", position: 0 }],
  weekChanges: [],
  planChanges: [],
  membershipDays: [],
});

describe("Today", () => {
  it("starts today's planned hangboard workout on its grip, against its plan", async () => {
    await renderWithHang(<TodayScreen />, hangData(), { plan: plan("max10") });
    await fireEvent.press(screen.getByText("Start"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/workout/timer",
      params: {
        workoutId: "max10",
        gripId: "half",
        membershipId: "m1",
        session: "0",
        focus: "strength",
      },
    });
  });

  it("shows a past planned day as missed, to log, reschedule or skip but not start", async () => {
    await renderWithHang(<TodayScreen />, hangData(), { plan: plan("max10") });
    await fireEvent.press(screen.getByLabelText(/^Monday.*0 done, 1 planned$/));
    expect(screen.getByLabelText("Missed: Max hangs")).toBeTruthy();
    // Only today's card starts; Monday's row is the first Max hangs in the week.
    expect(screen.getAllByText("Start")).toHaveLength(1);
    await fireEvent.press(screen.getAllByText("Max hangs")[0]!);
    expect(screen.getByText("Record it as done")).toBeTruthy();
    expect(screen.getByText("Reschedule")).toBeTruthy();
    expect(screen.getByText("Not counted as missed")).toBeTruthy();
  });

  it("shows a planned workout once it is done in its place, as its logged session", async () => {
    const hang = aHang({ workoutId: "max10", date: "2026-09-28", membershipId: "m1" });
    await renderWithHang(<TodayScreen />, hangData({ sessions: [hang] }), { plan: plan("max10") });
    await fireEvent.press(screen.getByLabelText(/^Monday.*1 done, 0 planned$/));
    expect(screen.queryByText("Done")).toBeNull();
    // Monday's logged hang, and today's card: Monday's plan is not listed again.
    expect(screen.getAllByText("Max hangs")).toHaveLength(2);
  });

  it("lists every day of the week, an empty one as its date alone", async () => {
    await renderWithHang(<TodayScreen />, hangData(), { plan: plan("max10") });
    expect(screen.queryByText(/of \d+ done$/)).toBeNull();
    expect(screen.getByText("Wednesday, Sep 30")).toBeTruthy();
    expect(screen.getByText("Sunday, Oct 4")).toBeTruthy();
    expect(screen.queryByText("Rest day")).toBeNull();
  });

  it("lists every block in progress with its workouts, leaving out a finished one", async () => {
    const inBlocks: Plan = {
      ...plan("max10"),
      blocks: [
        { id: "b1", name: "Winter base", start: "2026-09-21", weeks: 4, focus: null },
        { id: "b2", name: "Power phase", start: "2026-09-28", weeks: 2, focus: null },
        { id: "b0", name: "Summer base", start: "2026-08-03", weeks: 4, focus: null },
      ],
      memberships: [
        {
          id: "m1",
          workoutId: "max10",
          blockId: "b1",
          weekdays: [0, 1],
          start: "2026-09-21",
          position: 0,
        },
      ],
    };
    await renderWithHang(<TodayScreen />, hangData(), { plan: inBlocks });
    expect(screen.getByText("Blocks in progress")).toBeTruthy();
    expect(screen.getByText("1 workout")).toBeTruthy();
    expect(screen.getByText("0 workouts")).toBeTruthy();
    expect(screen.queryByText("Summer base")).toBeNull();
    await fireEvent.press(screen.getByText("Winter base"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/plan/block/[id]",
      params: { id: "b1", back: "Plan" },
    });
  });

  it("names a single running block in the singular", async () => {
    const inBlock: Plan = {
      ...plan("max10"),
      blocks: [{ id: "b1", name: "Winter base", start: "2026-09-21", weeks: 4, focus: null }],
    };
    await renderWithHang(<TodayScreen />, hangData(), { plan: inBlock });
    expect(screen.getByText("Block in progress")).toBeTruthy();
  });

  it("schedules on the day picked, naming it", async () => {
    await renderWithHang(<TodayScreen />, hangData(), { plan: plan("max10") });
    await fireEvent.press(screen.getByLabelText(/^Monday/));
    await fireEvent.press(screen.getByText("Schedule"));
    expect(screen.getAllByText("Schedule")).toHaveLength(2);
    expect(screen.getByText("Mon, Sep 28")).toBeTruthy();
    expect(screen.getByText("New workout")).toBeTruthy();
  });

  it("schedules a template or a past block from the day picked, staying on Plan", async () => {
    const blocks: Plan = {
      ...plan("max10"),
      blocks: [
        { id: "t1", name: "Peak weekend", start: null, weeks: 1, focus: null },
        { id: "p1", name: "Summer base", start: "2026-08-03", weeks: 4, focus: null },
        { id: "r1", name: "Winter base", start: "2026-09-21", weeks: 4, focus: null },
        { id: "u1", name: "Spring power", start: "2026-11-02", weeks: 2, focus: null },
      ],
    };
    await renderWithHang(<TodayScreen />, hangData(), { plan: blocks });
    await fireEvent.press(screen.getByLabelText(/^Wednesday/));
    await fireEvent.press(screen.getByText("Schedule"));
    await fireEvent.press(screen.getByText("Block"));
    expect(screen.getByText("Summer base")).toBeTruthy();
    expect(screen.queryByText("Spring power")).toBeNull();
    expect(screen.getAllByText("Winter base")).toHaveLength(1);
    expect(screen.getByText("New block")).toBeTruthy();
    await fireEvent.press(screen.getByText("Peak weekend"));
    expect(screen.getByText("When does it start?")).toBeTruthy();
    await fireEvent.press(screen.getByText("Schedule from Wed, Sep 30"));
    expect(mockPlanActions.copyBlock).toHaveBeenCalledWith("t1", "b-new", "2026-09-30");
    expect(screen.queryByText("When does it start?")).toBeNull();
    await fireEvent.press(screen.getByText("View"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/plan/block/[id]",
      params: { id: "b-new", back: "Plan" },
    });
  });

  it("starts a block no earlier than today when a past day is picked", async () => {
    const blocks: Plan = {
      ...plan("max10"),
      blocks: [{ id: "t1", name: "Peak weekend", start: null, weeks: 1, focus: null }],
    };
    await renderWithHang(<TodayScreen />, hangData(), { plan: blocks });
    await fireEvent.press(screen.getByLabelText(/^Monday/));
    await fireEvent.press(screen.getByText("Schedule"));
    await fireEvent.press(screen.getByText("Block"));
    await fireEvent.press(screen.getByText("Peak weekend"));
    expect(screen.getByText("Schedule from Tue, Sep 29")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Back"));
    expect(screen.getByText("Peak weekend")).toBeTruthy();
    expect(screen.queryByText("When does it start?")).toBeNull();
  });

  it("shows no blocks when none is running", async () => {
    await renderWithHang(<TodayScreen />, hangData(), { plan: plan("max10") });
    expect(screen.queryByText(/in progress$/)).toBeNull();
  });

  it("opens on the day it was sent back to", async () => {
    mockParams = { date: "2026-10-06", at: "1" };
    await renderWithHang(<TodayScreen />, hangData(), { plan: plan("max10") });
    mockParams = {};
    expect(screen.getByText("Next week")).toBeTruthy();
  });

  it("starts today's lifting workout in the sets player with what it prescribes", async () => {
    await renderWithHang(<TodayScreen />, hangData(), { plan: plan("legs"), workouts: [legs] });
    expect(screen.queryByText(/^Up today/)).toBeNull();
    expect(screen.getAllByText("5 × 5").length).toBeGreaterThan(0);
    await fireEvent.press(screen.getByText("Start"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/workout/sets",
      params: {
        kind: "strength",
        title: "Gym, legs",
        exerciseRestS: "180",
        date: "2026-09-29",
        workoutId: "legs",
        minutes: "50",
        items: JSON.stringify([{ exercise: "Back squat", dose: { sets: 5, reps: 5 } }]),
        membershipId: "m1",
      },
    });
  });

  it("logs today's workout without the timer, against the plan", async () => {
    await renderWithHang(<TodayScreen />, hangData(), { plan: plan("legs"), workouts: [legs] });
    await fireEvent.press(screen.getByText("Log it"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/activity/new",
      params: expect.objectContaining({ workoutId: "legs", membershipId: "m1", session: "0" }),
    });
  });

  it("starts a planned climbing day as a live session linked to the plan", async () => {
    await renderWithHang(<TodayScreen />, hangData(), { plan: plan("climb-limit") });
    await fireEvent.press(screen.getByText("Start"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/session/live",
      params: expect.objectContaining({ membershipId: "m1" }),
    });
  });

  it("skips today's workout from its ··· menu, with why", async () => {
    await renderWithHang(<TodayScreen />, hangData(), { plan: plan("max10") });
    await fireEvent.press(screen.getAllByLabelText("More").at(-1)!);
    await fireEvent.press(screen.getByText("Skip"));
    expect(screen.getByText("Skip it?")).toBeTruthy();
    await fireEvent.press(screen.getByText("Sore"));
    await fireEvent.press(screen.getAllByText("Skip").at(-1)!);
    expect(mockPlanActions.savePlanChange).toHaveBeenCalledWith({
      membershipId: "m1",
      plannedOn: "2026-09-29",
      kind: "skip",
      movedTo: null,
      reason: "sore",
      note: null,
    });
  });

  it("shows a skipped day faded with why, and undoes it", async () => {
    const skipped: Plan = {
      ...plan("max10"),
      planChanges: [
        {
          membershipId: "m1",
          plannedOn: "2026-09-29",
          kind: "skip",
          movedTo: null,
          reason: "sick",
          note: "Head cold",
        },
      ],
    };
    await renderWithHang(<TodayScreen />, hangData(), { plan: skipped });
    expect(screen.getByText("Skipped · Sick")).toBeTruthy();
    expect(screen.getByText("Head cold")).toBeTruthy();
    await fireEvent.press(screen.getByText("Undo skip"));
    expect(mockPlanActions.undoPlanChange).toHaveBeenCalledWith("m1", "2026-09-29");
  });

  it("removes a one-off from its ··· menu", async () => {
    const oneOff: Plan = {
      ...plan("max10"),
      memberships: [
        {
          id: "m1",
          workoutId: "max10",
          blockId: null,
          weekdays: [],
          start: "2026-09-29",
          position: 0,
        },
      ],
    };
    await renderWithHang(<TodayScreen />, hangData(), { plan: oneOff });
    await fireEvent.press(screen.getByLabelText("More"));
    expect(screen.getByText("Unschedule this workout")).toBeTruthy();
    await fireEvent.press(screen.getByText("Remove"));
    expect(mockPlanActions.deleteMembership).toHaveBeenCalledWith("m1");
  });

  it("leaves Remove off a repeating plan, which Skip covers", async () => {
    await renderWithHang(<TodayScreen />, hangData(), { plan: plan("max10") });
    await fireEvent.press(screen.getAllByLabelText("More").at(-1)!);
    expect(screen.queryByText("Remove")).toBeNull();
  });

  it("reschedules today's workout to any later day picked on the calendar", async () => {
    await renderWithHang(<TodayScreen />, hangData(), { plan: plan("max10") });
    await fireEvent.press(screen.getAllByLabelText("More").at(-1)!);
    await fireEvent.press(screen.getByText("Reschedule"));
    await fireEvent.press(screen.getByLabelText("Next month"));
    await fireEvent.press(screen.getByLabelText("Wednesday, Oct 7"));
    await fireEvent.press(screen.getByText("Reschedule to Wed, Oct 7"));
    expect(mockPlanActions.savePlanChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ kind: "move", plannedOn: "2026-09-29", movedTo: "2026-10-07" })
    );
  });
});
