import { beforeEach, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import type { Plan, WorkoutRecord } from "@sendtally/api-client";
import type { PlanDraft } from "@sendtally/features/training";
import { hangData, renderWithHang } from "../data/renderWithHang";
import { BlocksList } from "../train/BlocksList";
import { OngoingScreen } from "./OngoingScreen";

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

const workout = (id: string, name: string): WorkoutRecord => ({
  id,
  kind: "strength",
  name,
  description: "",
  minutes: 45,
  targetRpe: null,
  items: [{ exercise: "Back squat", doses: [{ sets: 5, reps: 5, weightKg: 100 }] }],
  exerciseRestS: 180,
  focus: null,
  updatedAt: "t",
});
const workouts = [workout("squat", "Back squat"), workout("run", "Easy run")];

const weekly = (id: string, workoutId: string, weekdays: (0 | 1 | 2 | 3 | 4 | 5 | 6)[]) => ({
  id,
  workoutId,
  blockId: null,
  weekdays,
  start: "2026-09-01",
  position: 0,
});

const plan: Plan = {
  blocks: [],
  memberships: [weekly("m1", "squat", [0]), weekly("m2", "run", [2])],
  weekChanges: [],
  planChanges: [],
  membershipDays: [],
};

beforeEach(() => {
  jest.clearAllMocks();
});

it("opens Ongoing from its card on Train", async () => {
  await renderWithHang(<BlocksList />, hangData(), { workouts, plan });
  expect(screen.getByText("These workouts repeat on a weekly basis")).toBeTruthy();
  await fireEvent.press(screen.getByLabelText("Open Ongoing"));
  expect(router.push).toHaveBeenCalledWith({
    pathname: "/plan/ongoing",
    params: { back: "Train" },
  });
});

it("sets days and takes workouts out in Edit, saved together and dropped on Cancel", async () => {
  await renderWithHang(<OngoingScreen />, hangData(), { workouts, plan });
  expect(screen.getByText("Your week")).toBeTruthy();
  expect(screen.queryByLabelText("Remove Easy run from your plan")).toBeNull();
  await fireEvent.press(screen.getByText("Edit"));
  expect(screen.getByText("Edit Ongoing")).toBeTruthy();
  await fireEvent.press(screen.getByLabelText("Remove Easy run from your plan"));
  expect(screen.queryByText("Easy run")).toBeNull();
  await fireEvent.press(screen.getByText("Cancel"));
  expect(screen.getByText("Easy run")).toBeTruthy();
  expect(mockPlan.saveDraft).not.toHaveBeenCalled();

  await fireEvent.press(screen.getByText("Edit"));
  await fireEvent.press(screen.getByLabelText("Back squat, Thursday"));
  await fireEvent.press(screen.getByLabelText("Remove Easy run from your plan"));
  await fireEvent.press(screen.getByText("Save"));
  const draft = mockPlan.saveDraft.mock.calls[0]?.[0];
  expect(draft?.removed).toEqual(["m2"]);
  expect(draft?.schedules).toEqual([{ membershipId: "m1", weekdays: [0, 3], weeks: [] }]);
  expect(router.back).not.toHaveBeenCalled();
});

it("goes back to Train once Save leaves nothing in it", async () => {
  await renderWithHang(<OngoingScreen />, hangData(), { workouts, plan });
  await fireEvent.press(screen.getByText("Edit"));
  await fireEvent.press(screen.getByLabelText("Remove Back squat from your plan"));
  await fireEvent.press(screen.getByLabelText("Remove Easy run from your plan"));
  await fireEvent.press(screen.getByText("Save"));
  expect(router.back).toHaveBeenCalled();
});
