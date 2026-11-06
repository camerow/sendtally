import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import { Alert, type AlertButton } from "react-native";
import type { Plan, WorkoutRecord } from "@sendtally/api-client";
import type * as Workouts from "@sendtally/features/workouts";
import { hangData, renderWithHang } from "../data/renderWithHang";
import { AddWorkoutsSheet } from "./AddWorkoutsSheet";
import { ScheduleScreen } from "./ScheduleScreen";
import { WorkoutScreen } from "../library-detail/WorkoutScreen";

const mockPlan = {
  saveBlock: jest.fn(),
  deleteBlock: jest.fn(),
  saveMembership: jest.fn(),
  deleteMembership: jest.fn(),
  saveWeekChange: jest.fn(),
  saveSchedule: jest.fn(),
};

const mockWorkouts = { saveWorkout: jest.fn(), deleteWorkout: jest.fn() };

jest.mock("../plan/usePlanActions", () => ({ usePlanActions: () => mockPlan }));
jest.mock("@sendtally/features/workouts", () => ({
  ...jest.requireActual<typeof Workouts>("@sendtally/features/workouts"),
  useWorkoutActions: () => mockWorkouts,
}));
jest.mock("../../../components/Sheet", () => ({
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? children : null,
}));
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), back: jest.fn(), dismissTo: jest.fn() },
  useFocusEffect: jest.fn(),
}));
jest.mock("expo-crypto", () => ({ randomUUID: () => "m-new" }));

const legs: WorkoutRecord = {
  id: "legs",
  kind: "strength",
  name: "Gym, legs",
  description: "Squats, then the rest.",
  minutes: 50,
  targetRpe: null,
  items: [
    {
      exercise: "Back squat",
      doses: [
        { sets: 5, reps: 5 },
        { sets: 3, reps: 8 },
      ],
    },
  ],
  exerciseRestS: 180,
  focus: null,
  updatedAt: "t",
};

const winter: Plan = {
  blocks: [{ id: "b1", name: "Winter base", start: "2026-10-05", weeks: 6, focus: null }],
  memberships: [],
  weekChanges: [],
  planChanges: [],
  membershipDays: [],
};

// Today is Tuesday 29 September 2026; Thursday 1 October is the day asked from.
const flow = { date: "2026-10-01", blockId: null };

beforeEach(() => {
  jest.clearAllMocks();
});

describe("adding to the plan", () => {
  it("lists every workout under its focus, searched across all, each added with +", async () => {
    const onClose = jest.fn();
    await renderWithHang(<AddWorkoutsSheet flow={flow} visible onClose={onClose} />, hangData(), {
      workouts: [legs],
    });
    expect(screen.getByText("Thu, Oct 1")).toBeTruthy();
    expect(screen.getAllByText("Strength").length).toBeGreaterThan(1);
    expect(screen.getByText("General")).toBeTruthy();
    expect(screen.getByText("5x5 strength")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Search workouts"), "legs");
    expect(screen.queryByText("5x5 strength")).toBeNull();
    await fireEvent.press(screen.getByLabelText("Add Gym, legs"));
    expect(mockPlan.saveMembership).toHaveBeenCalledWith({
      id: "m-new",
      workoutId: "legs",
      blockId: null,
      weekdays: [],
      start: "2026-10-01",
      position: 0,
    });
    await fireEvent.press(screen.getByText("Gym, legs"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/workout/[id]",
      params: { id: "legs", add: "1", date: "2026-10-01" },
    });
  });

  it("reads In block for a workout already there, and closes on Done", async () => {
    const there = {
      id: "m-old",
      workoutId: "strength-5x5",
      blockId: "b1",
      weekdays: [],
      start: "2026-10-05",
      position: 0,
    };
    const onClose = jest.fn();
    await renderWithHang(
      <AddWorkoutsSheet flow={{ date: null, blockId: "b1" }} visible onClose={onClose} />,
      hangData(),
      { workouts: [legs], plan: { ...winter, memberships: [there] } }
    );
    expect(screen.getByText("Add workouts")).toBeTruthy();
    expect(screen.getByText("In block")).toBeTruthy();
    expect(screen.queryByLabelText("Add 5x5 strength")).toBeNull();
    await fireEvent.press(screen.getByText("Done"));
    expect(onClose).toHaveBeenCalledWith([]);
  });

  it("shows the next session and what each exercise alternates with, and Add adds it as + does", async () => {
    await renderWithHang(<WorkoutScreen id="legs" adding={flow} />, hangData(), {
      workouts: [legs],
    });
    expect(screen.getByText("Next session")).toBeTruthy();
    expect(screen.getByText("then B")).toBeTruthy();
    expect(screen.getByText("5 × 5")).toBeTruthy();
    expect(screen.getByText("Alternates: B is 3 × 8")).toBeTruthy();
    expect(screen.queryByText("Start")).toBeNull();
    await fireEvent.press(screen.getByText("Add"));
    expect(mockPlan.saveMembership).toHaveBeenCalledWith(
      expect.objectContaining({ workoutId: "legs", start: "2026-10-01", weekdays: [] })
    );
    expect(router.back).toHaveBeenCalled();
  });

  it("names each dose next to its letter when it has a name", async () => {
    const named = {
      ...legs,
      items: [
        {
          exercise: "Back squat",
          doses: [
            { sets: 5, reps: 5, name: "Heavy" },
            { sets: 3, reps: 8, name: "Light" },
          ],
        },
      ],
    };
    await renderWithHang(<WorkoutScreen id="legs" adding={flow} />, hangData(), {
      workouts: [named],
    });
    expect(screen.getByText("Heavy then B Light")).toBeTruthy();
    expect(screen.getByText("Alternates: B Light is 3 × 8")).toBeTruthy();
  });

  it("opened from the library, starts or edits it instead", async () => {
    await renderWithHang(<WorkoutScreen id="legs" />, hangData(), {
      workouts: [legs],
    });
    expect(screen.getByText("Start")).toBeTruthy();
    await fireEvent.press(screen.getByText("Edit"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/workout/edit",
      params: { id: "legs" },
    });
  });

  it("deletes the user's own workout from its ··· menu, once confirmed", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    await renderWithHang(<WorkoutScreen id="legs" />, hangData(), {
      workouts: [legs],
    });
    expect(screen.queryByText("Delete workout")).toBeNull();
    await fireEvent.press(screen.getByLabelText("More"));
    expect(screen.getByText("Duplicate")).toBeTruthy();
    await fireEvent.press(screen.getByText("Delete workout"));
    expect(mockWorkouts.deleteWorkout).not.toHaveBeenCalled();
    const buttons = alert.mock.calls[0]?.[2] as AlertButton[];
    buttons.find((b) => b.style === "destructive")?.onPress?.();
    expect(mockWorkouts.deleteWorkout).toHaveBeenCalledWith("legs");
    expect(router.back).toHaveBeenCalled();
  });

  it("saves a weekly plan from the day's weekday and returns to Today on its start", async () => {
    await renderWithHang(<ScheduleScreen workoutId="legs" flow={flow} />, hangData(), {
      workouts: [legs],
    });
    await fireEvent.press(screen.getByLabelText("Monday"));
    await fireEvent.press(screen.getByText("Add every Mon, Thu"));
    expect(mockPlan.saveMembership).toHaveBeenCalledWith({
      id: "m-new",
      workoutId: "legs",
      blockId: null,
      weekdays: [0, 3],
      start: "2026-10-01",
      position: 0,
    });
    expect(router.dismissTo).toHaveBeenCalledWith({
      pathname: "/(tabs)/today",
      params: expect.objectContaining({ date: "2026-10-01" }),
    });
  });

  it("puts a weekly plan in a block from the block's start", async () => {
    await renderWithHang(
      <ScheduleScreen workoutId="legs" flow={{ date: null, blockId: "b1" }} />,
      hangData(),
      { workouts: [legs], plan: winter }
    );
    expect(screen.queryByText("Starts")).toBeNull();
    await fireEvent.press(screen.getByLabelText("Tuesday"));
    await fireEvent.press(screen.getByText("Add every Tue"));
    expect(mockPlan.saveMembership).toHaveBeenCalledWith({
      id: "m-new",
      workoutId: "legs",
      blockId: "b1",
      weekdays: [1],
      start: "2026-10-05",
      position: 0,
    });
    expect(router.dismissTo).toHaveBeenCalledWith({
      pathname: "/plan/block/[id]",
      params: { id: "b1", highlight: "m-new" },
    });
  });

  it("adds to a template with no days, straight back to the sheet", async () => {
    const template = {
      ...winter,
      blocks: [{ id: "t1", name: "Base to peak", start: null, weeks: 6, focus: null }],
    };
    await renderWithHang(
      <WorkoutScreen id="legs" adding={{ date: null, blockId: "t1" }} />,
      hangData(),
      { workouts: [legs], plan: template }
    );
    await fireEvent.press(screen.getByText("Add"));
    expect(mockPlan.saveMembership).toHaveBeenCalledWith({
      id: "m-new",
      workoutId: "legs",
      blockId: "t1",
      weekdays: [],
      start: "2026-09-29",
      position: 0,
    });
    expect(router.back).toHaveBeenCalled();
  });

  it("saves a one-off per picked date", async () => {
    await renderWithHang(<ScheduleScreen workoutId="legs" flow={flow} />, hangData(), {
      workouts: [legs],
      plan: winter,
    });
    await fireEvent.press(screen.getByText("On specific days"));
    expect(screen.getByText("Add on Thu, Oct 1")).toBeTruthy();
    expect(screen.getByText("Winter base · 1/6")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Saturday, Oct 3"));
    await fireEvent.press(screen.getByText("Add on 2 days"));
    expect(mockPlan.saveMembership.mock.calls.map(([m]) => m)).toEqual([
      {
        id: "m-new",
        workoutId: "legs",
        blockId: null,
        weekdays: [],
        start: "2026-10-01",
        position: 0,
      },
      {
        id: "m-new",
        workoutId: "legs",
        blockId: null,
        weekdays: [],
        start: "2026-10-03",
        position: 0,
      },
    ]);
  });
});
