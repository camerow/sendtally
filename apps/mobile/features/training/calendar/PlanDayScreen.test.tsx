import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import type { Plan, WorkoutRecord } from "@sendtally/api-client";
import { hangData, renderWithHang } from "../data/renderWithHang";
import { PlanDayScreen } from "./PlanDayScreen";

jest.mock("expo-router", () => ({ router: { push: jest.fn(), back: jest.fn() } }));

const legs: WorkoutRecord = {
  id: "legs",
  kind: "strength",
  name: "Gym, legs",
  description: "",
  minutes: 50,
  targetRpe: null,
  variations: [{ label: "", items: [{ exercise: "Back squat", dose: { sets: 5, reps: 5 } }] }],
  pattern: [0],
  exerciseRestS: 180,
  updatedAt: "t",
};

// Legs on Mondays and Tuesdays in a block; today is Tuesday 29 September.
const plan: Plan = {
  blocks: [{ id: "b1", name: "Autumn power", start: "2026-09-28", weeks: 4 }],
  memberships: [
    { id: "m1", workoutId: "legs", blockId: "b1", weekdays: [0, 1], start: "2026-09-28" },
  ],
  weekChanges: [],
};
const world = { plan, workouts: [legs] };

describe("Plan day", () => {
  beforeEach(() => {
    jest.mocked(router.push).mockClear();
  });

  it("lists today's workout with its block week, and starts it against the plan", async () => {
    await renderWithHang(<PlanDayScreen date="2026-09-29" />, hangData(), world);
    expect(screen.getByText("Autumn power · week 1 of 4")).toBeTruthy();
    expect(screen.getByText("Gym, legs")).toBeTruthy();
    expect(screen.getByText("Planned")).toBeTruthy();
    await fireEvent.press(screen.getByText("Start"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/workout/sets",
      params: {
        kind: "strength",
        title: "Gym, legs",
        date: "2026-09-29",
        workoutId: "legs",
        minutes: "50",
        exerciseRestS: "180",
        items: JSON.stringify([{ exercise: "Back squat", dose: { sets: 5, reps: 5 } }]),
        membershipId: "m1",
        variation: "0",
        week: "1",
      },
    });
  });

  it("shows a past day's workout as missed and opens its preview", async () => {
    await renderWithHang(<PlanDayScreen date="2026-09-28" />, hangData(), world);
    expect(screen.getByText("Missed")).toBeTruthy();
    await fireEvent.press(screen.getByText("Gym, legs"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/workout/preview",
      params: { id: "legs" },
    });
  });

  it("adds on the day inside its block", async () => {
    await renderWithHang(<PlanDayScreen date="2026-09-30" />, hangData(), world);
    expect(screen.getByText("Nothing planned on this day.")).toBeTruthy();
    await fireEvent.press(screen.getByText("Add on this day"));
    expect(router.push).toHaveBeenCalledWith("/plan/add?date=2026-09-30&blockId=b1");
  });
});
