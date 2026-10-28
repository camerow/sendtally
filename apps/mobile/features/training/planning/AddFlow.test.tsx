import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import { Alert, type AlertButton } from "react-native";
import type { Plan, WorkoutRecord } from "@sendtally/api-client";
import type * as Workouts from "@sendtally/features/workouts";
import { hangData, renderWithHang } from "../data/renderWithHang";
import { AddPlanScreen } from "./AddPlanScreen";
import { ScheduleScreen } from "./ScheduleScreen";
import { WorkoutPreviewScreen } from "./WorkoutPreviewScreen";

const mockPlan = {
  saveBlock: jest.fn(),
  deleteBlock: jest.fn(),
  saveMembership: jest.fn(),
  deleteMembership: jest.fn(),
  saveWeekChange: jest.fn(),
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
};

// Today is Tuesday 29 September 2026; Thursday 1 October is the day asked from.
const flow = { date: "2026-10-01", blockId: null };

beforeEach(() => {
  jest.clearAllMocks();
});

describe("adding to the plan", () => {
  it("asks the kind, then lists that kind's workouts in one list, the user's own first and labelled", async () => {
    await renderWithHang(<AddPlanScreen flow={flow} />, hangData(), { workouts: [legs] });
    expect(screen.getByText("What kind?")).toBeTruthy();
    await fireEvent.press(screen.getByText("Strength"));
    expect(screen.queryByText("What kind?")).toBeNull();
    expect(screen.getByText("For Thu, Oct 1")).toBeTruthy();
    expect(screen.getByText("Mine")).toBeTruthy();
    expect(screen.getByText("5x5 strength")).toBeTruthy();
    expect(screen.queryByText("Climber's yoga")).toBeNull();
    await fireEvent.changeText(screen.getByLabelText("Search workouts"), "legs");
    expect(screen.queryByText("5x5 strength")).toBeNull();
    await fireEvent.press(screen.getByText("Gym, legs"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/workout/preview",
      params: { id: "legs", add: "1", date: "2026-10-01" },
    });
  });

  it("opens on the kind already picked, with no sheet", async () => {
    await renderWithHang(<AddPlanScreen flow={flow} initialKind="strength" />, hangData(), {
      workouts: [legs],
    });
    expect(screen.queryByText("What kind?")).toBeNull();
    expect(screen.getByText("Strength")).toBeTruthy();
  });

  it("goes back when the sheet closes with no kind picked", async () => {
    await renderWithHang(<AddPlanScreen flow={flow} />, hangData());
    await fireEvent.press(screen.getByText("Cancel"));
    expect(router.back).toHaveBeenCalled();
  });

  it("makes a new workout of the kind, and changes kind without leaving", async () => {
    await renderWithHang(<AddPlanScreen flow={flow} />, hangData(), { workouts: [legs] });
    await fireEvent.press(screen.getByText("Mobility"));
    await fireEvent.press(screen.getByText("New workout"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/workout/edit",
      params: { kind: "mobility" },
    });
    expect(router.back).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByText("Change type"));
    await fireEvent.press(screen.getByText("Cancel"));
    expect(router.back).not.toHaveBeenCalled();
  });

  it("previews the next session and what each exercise alternates with, then goes on to when", async () => {
    await renderWithHang(<WorkoutPreviewScreen id="legs" adding={flow} />, hangData(), {
      workouts: [legs],
    });
    expect(screen.getByText("Next session")).toBeTruthy();
    expect(screen.getByText("then B")).toBeTruthy();
    expect(screen.getByText("5 × 5")).toBeTruthy();
    expect(screen.getByText("Alternates: B is 3 × 8")).toBeTruthy();
    expect(screen.queryByText("Start")).toBeNull();
    await fireEvent.press(screen.getByText("Add to plan"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/plan/schedule",
      params: { workoutId: "legs", date: "2026-10-01" },
    });
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
    await renderWithHang(<WorkoutPreviewScreen id="legs" adding={flow} />, hangData(), {
      workouts: [named],
    });
    expect(screen.getByText("Heavy then B Light")).toBeTruthy();
    expect(screen.getByText("Alternates: B Light is 3 × 8")).toBeTruthy();
  });

  it("previewed from the library, starts or edits it instead", async () => {
    await renderWithHang(<WorkoutPreviewScreen id="legs" adding={null} />, hangData(), {
      workouts: [legs],
    });
    expect(screen.queryByText("Add to plan")).toBeNull();
    await fireEvent.press(screen.getByText("Edit"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/workout/edit",
      params: { id: "legs" },
    });
  });

  it("deletes the user's own workout from its preview, once confirmed", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    await renderWithHang(<WorkoutPreviewScreen id="legs" adding={null} />, hangData(), {
      workouts: [legs],
    });
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
    });
    expect(router.dismissTo).toHaveBeenCalledWith({
      pathname: "/plan/block/[id]",
      params: { id: "b1", highlight: "m-new" },
    });
  });

  it("saves a one-off per picked date", async () => {
    await renderWithHang(<ScheduleScreen workoutId="legs" flow={flow} />, hangData(), {
      workouts: [legs],
      plan: winter,
    });
    await fireEvent.press(screen.getByText("On specific days"));
    expect(screen.getByText("Add on Thu, Oct 1")).toBeTruthy();
    expect(screen.getByText("Winter base · 1/6")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Saturday Oct 3"));
    await fireEvent.press(screen.getByText("Add on 2 days"));
    expect(mockPlan.saveMembership.mock.calls.map(([m]) => m)).toEqual([
      { id: "m-new", workoutId: "legs", blockId: null, weekdays: [], start: "2026-10-01" },
      { id: "m-new", workoutId: "legs", blockId: null, weekdays: [], start: "2026-10-03" },
    ]);
  });
});
