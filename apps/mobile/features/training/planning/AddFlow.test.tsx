import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import type { Plan, WorkoutRecord } from "@sendtally/api-client";
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

jest.mock("../plan/usePlanActions", () => ({ usePlanActions: () => mockPlan }));
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
  variations: [
    { label: "Heavy", items: [{ exercise: "Back squat", dose: { sets: 5, reps: 5 } }] },
    { label: "Light", items: [{ exercise: "Back squat", dose: { sets: 3, reps: 8 } }] },
  ],
  pattern: [0, 1],
  exerciseRestS: 180,
  updatedAt: "t",
};

const winter: Plan = {
  blocks: [{ id: "b1", name: "Winter base", start: "2026-10-05", weeks: 6 }],
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

  it("previews the workout with how it takes turns, then goes on to when", async () => {
    await renderWithHang(<WorkoutPreviewScreen id="legs" adding={flow} />, hangData(), {
      workouts: [legs],
    });
    expect(screen.getByText("Takes turns by session: Heavy, Light")).toBeTruthy();
    expect(screen.queryByText("Start")).toBeNull();
    await fireEvent.press(screen.getByText("Add to plan"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/plan/schedule",
      params: { workoutId: "legs", date: "2026-10-01" },
    });
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

  it("saves a weekly plan from the day's weekday and returns to the plan with it lit", async () => {
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
      pathname: "/(tabs)/train",
      params: expect.objectContaining({ view: "plan", highlight: "m-new" }),
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
  });

  it("saves a one-off per picked date", async () => {
    await renderWithHang(<ScheduleScreen workoutId="legs" flow={flow} />, hangData(), {
      workouts: [legs],
    });
    await fireEvent.press(screen.getByText("On specific days"));
    expect(screen.getByText("Add on Thu, Oct 1")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Saturday Oct 3"));
    await fireEvent.press(screen.getByText("Add on 2 days"));
    expect(mockPlan.saveMembership.mock.calls.map(([m]) => m)).toEqual([
      { id: "m-new", workoutId: "legs", blockId: null, weekdays: [], start: "2026-10-01" },
      { id: "m-new", workoutId: "legs", blockId: null, weekdays: [], start: "2026-10-03" },
    ]);
  });
});
