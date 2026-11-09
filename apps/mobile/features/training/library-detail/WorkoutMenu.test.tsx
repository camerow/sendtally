import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import type { Plan, WorkoutRecord } from "@sendtally/api-client";
import type * as Workouts from "@sendtally/features/workouts";
import { hangData, renderWithHang } from "../data/renderWithHang";
import { WorkoutScreen } from "./WorkoutScreen";

const mockPlan = { saveMembership: jest.fn(), saveSchedule: jest.fn() };
const mockWorkouts = { saveWorkout: jest.fn(), deleteWorkout: jest.fn() };

jest.mock("../plan/usePlanActions", () => ({ usePlanActions: () => mockPlan }));
jest.mock("@sendtally/features/workouts", () => ({
  ...jest.requireActual<typeof Workouts>("@sendtally/features/workouts"),
  useWorkoutActions: () => mockWorkouts,
}));
jest.mock("../../../lib/api", () => ({ useApi: () => undefined }));
jest.mock("../../../components/Sheet", () => ({
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? children : null,
}));
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
}));
jest.mock("expo-crypto", () => ({ randomUUID: () => "m-new" }));

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

const plan = (over: Partial<Plan> = {}): Plan => ({
  blocks: [
    { id: "b1", name: "Winter base", start: "2026-10-05", weeks: 6, focus: null },
    { id: "t1", name: "Power phase", start: null, weeks: 4, focus: null },
    { id: "old", name: "Summer", start: "2026-06-01", weeks: 4, focus: null },
  ],
  memberships: [],
  weekChanges: [],
  planChanges: [],
  membershipDays: [],
  ...over,
});

const openAddToBlock = async (): Promise<void> => {
  await fireEvent.press(screen.getByLabelText("More"));
  await fireEvent.press(screen.getByText("Add to block"));
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Add to block", () => {
  it("offers templates and blocks not over yet, each with its dates or Template", async () => {
    await renderWithHang(<WorkoutScreen id="legs" />, hangData(), {
      workouts: [legs],
      plan: plan(),
    });
    await openAddToBlock();
    expect(screen.getByText("Winter base")).toBeTruthy();
    expect(screen.getByText("Power phase")).toBeTruthy();
    expect(screen.getByText("Template")).toBeTruthy();
    expect(screen.queryByText("Summer")).toBeNull();
  });

  it("adds it with no days from the block's start, then says where with a way there", async () => {
    await renderWithHang(<WorkoutScreen id="legs" />, hangData(), {
      workouts: [legs],
      plan: plan(),
    });
    await openAddToBlock();
    await fireEvent.press(screen.getByText("Winter base"));
    expect(mockPlan.saveMembership).toHaveBeenCalledWith({
      id: "m-new",
      workoutId: "legs",
      blockId: "b1",
      weekdays: [],
      start: "2026-10-05",
      position: 0,
    });
    expect(screen.queryByText("Power phase")).toBeNull();
    await fireEvent.press(screen.getByText("View"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/plan/block/[id]",
      params: { id: "b1" },
    });
  });

  it("checks a block that already holds it, and tapping it does nothing", async () => {
    const holding = plan({
      memberships: [
        { id: "m1", workoutId: "legs", blockId: "t1", weekdays: [], start: "x", position: 0 },
      ],
    });
    await renderWithHang(<WorkoutScreen id="legs" />, hangData(), {
      workouts: [legs],
      plan: holding,
    });
    await openAddToBlock();
    const there = screen.getByRole("radio", { name: "Power phase, Template" });
    expect(there.props).toMatchObject({ accessibilityState: { checked: true } });
    await fireEvent.press(there);
    expect(mockPlan.saveMembership).not.toHaveBeenCalled();
  });

  it("is left out with no block to offer", async () => {
    await renderWithHang(<WorkoutScreen id="legs" />, hangData(), {
      workouts: [legs],
      plan: plan({ blocks: [] }),
    });
    await fireEvent.press(screen.getByLabelText("More"));
    expect(screen.queryByText("Add to block")).toBeNull();
    expect(screen.getByText("Duplicate")).toBeTruthy();
  });

  it("stays on a planned run, where the workout cannot be edited", async () => {
    await renderWithHang(
      <WorkoutScreen id="legs" run={{ date: "2026-10-05", membershipId: "m1" }} />,
      hangData(),
      {
        workouts: [legs],
        plan: plan({
          memberships: [
            {
              id: "m1",
              workoutId: "legs",
              blockId: null,
              weekdays: [0],
              start: "2026-09-28",
              position: 0,
            },
          ],
        }),
      }
    );
    expect(screen.queryByText("Edit")).toBeNull();
    await fireEvent.press(screen.getByLabelText("More"));
    expect(screen.getByText("Add to block")).toBeTruthy();
  });
});

describe("Duplicate", () => {
  it("saves a copy and opens it in place of the original, so Back skips the original", async () => {
    await renderWithHang(<WorkoutScreen id="legs" />, hangData(), {
      workouts: [legs],
      plan: plan(),
    });
    await fireEvent.press(screen.getByLabelText("More"));
    await fireEvent.press(screen.getByText("Duplicate"));
    expect(mockWorkouts.saveWorkout).toHaveBeenCalledWith(
      "m-new",
      expect.objectContaining({ name: "Gym, legs (copy)" })
    );
    expect(router.replace).toHaveBeenCalledWith({
      pathname: "/workout/[id]",
      params: { id: "m-new" },
    });
    expect(router.push).not.toHaveBeenCalled();
  });
});
