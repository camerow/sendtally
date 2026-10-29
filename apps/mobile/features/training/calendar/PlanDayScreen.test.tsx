import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import type { ActivityRecord, Plan, WorkoutRecord } from "@sendtally/api-client";
import { hangData, renderWithHang } from "../data/renderWithHang";
import { PlanDayScreen } from "./PlanDayScreen";

jest.mock("../../../components/Sheet", () => ({
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? children : null,
}));
jest.mock("expo-router", () => ({ router: { push: jest.fn(), back: jest.fn() } }));

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

// Legs on Mondays and Tuesdays in a block; today is Tuesday 29 September.
const plan: Plan = {
  blocks: [{ id: "b1", name: "Autumn power", start: "2026-09-28", weeks: 4, focus: null }],
  memberships: [
    { id: "m1", workoutId: "legs", blockId: "b1", weekdays: [0, 1], start: "2026-09-28" },
  ],
  weekChanges: [],
};
const stretched: ActivityRecord = {
  id: "a1",
  kind: "mobility",
  title: "Hip opener flow",
  date: "2026-09-30",
  startTime: null,
  minutes: 15,
  rpe: 3,
  notes: null,
  workoutId: null,
  membershipId: null,
  week: null,
  focus: null,
  done: [],
  stravaActivityId: null,
  postedAt: null,
  postState: null,
  postError: null,
};

const world = { plan, workouts: [legs], activities: [stretched] };

describe("Plan day", () => {
  beforeEach(() => {
    jest.mocked(router.push).mockClear();
  });

  it("lists today's workout with its block week, and starts it against the plan", async () => {
    await renderWithHang(<PlanDayScreen date="2026-09-29" />, hangData(), world);
    expect(screen.getByText("Autumn power · week 1 of 4")).toBeTruthy();
    expect(screen.getByText("Gym, legs")).toBeTruthy();
    expect(screen.getByText(/^Up today/)).toBeTruthy();
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
        week: "1",
      },
    });
  });

  it("shows a past day's workout as missed with Start, and opens the workout", async () => {
    await renderWithHang(<PlanDayScreen date="2026-09-28" />, hangData(), world);
    expect(screen.getByText("Monday")).toBeTruthy();
    expect(screen.getByText("Missed")).toBeTruthy();
    expect(screen.getByText("Start")).toBeTruthy();
    await fireEvent.press(screen.getByText("Gym, legs"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/workout/[id]",
      params: { id: "legs" },
    });
  });

  it("leaves Start off a workout still to come", async () => {
    await renderWithHang(<PlanDayScreen date="2026-10-05" />, hangData(), world);
    expect(screen.getByText("Gym, legs")).toBeTruthy();
    expect(screen.queryByText("Start")).toBeNull();
  });

  it("shows what was logged on the day and opens it", async () => {
    await renderWithHang(<PlanDayScreen date="2026-09-30" />, hangData(), world);
    expect(screen.getByText("Wednesday")).toBeTruthy();
    expect(screen.getByText("Sep 30 · 0 planned · 1 done")).toBeTruthy();
    await fireEvent.press(screen.getByText("Hip opener flow"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/activity/[id]",
      params: { id: "a1" },
    });
  });

  it("adds on the day inside its block from the footer", async () => {
    await renderWithHang(<PlanDayScreen date="2026-09-30" />, hangData(), world);
    await fireEvent.press(screen.getByText("Add to Wed"));
    await fireEvent.press(screen.getByText("Mobility"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/plan/add",
      params: { date: "2026-09-30", blockId: "b1", kind: "mobility" },
    });
  });
});
