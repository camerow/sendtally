import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import type { Plan, WorkoutRecord } from "@sendtally/api-client";
import { renderWithHang, hangData } from "../data/renderWithHang";
import { TodayScreen } from "./TodayScreen";

jest.mock("../../../components/Sheet", () => ({ Sheet: () => null }));
let mockParams: Record<string, string> = {};

jest.mock("expo-router", () => ({
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
  variations: [{ label: "", items: [{ exercise: "Back squat", dose: { sets: 5, reps: 5 } }] }],
  pattern: [0],
  exerciseRestS: 180,
  updatedAt: "t",
};

// Mondays and Tuesdays; today is Tuesday 29 September.
const plan = (workoutId: string, weekdays: (0 | 1)[] = [0, 1]): Plan => ({
  blocks: [],
  memberships: [{ id: "m1", workoutId, blockId: null, weekdays, start: "2026-09-28" }],
  weekChanges: [],
});

describe("Today", () => {
  it("starts today's planned hangboard workout on its grip, against its plan", async () => {
    await renderWithHang(<TodayScreen />, hangData(), { plan: plan("max10") });
    expect(screen.getByText("Up today · Hangboard")).toBeTruthy();
    await fireEvent.press(screen.getByText("Start"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/workout/timer",
      params: { workoutId: "max10", gripId: "half", membershipId: "m1", variation: "0" },
    });
  });

  it("shows a past planned day as missed", async () => {
    await renderWithHang(<TodayScreen />, hangData(), { plan: plan("max10") });
    await fireEvent.press(screen.getByLabelText(/^Monday.*0 logged, 1 planned$/));
    expect(screen.getByText("Missed")).toBeTruthy();
  });

  it("counts the week as done of planned", async () => {
    await renderWithHang(<TodayScreen />, hangData(), { plan: plan("max10") });
    expect(screen.getByText("0 of 2 done")).toBeTruthy();
  });

  it("opens the block the day is in, by its week", async () => {
    const inBlock: Plan = {
      ...plan("max10"),
      blocks: [{ id: "b1", name: "Winter base", start: "2026-09-21", weeks: 4 }],
    };
    await renderWithHang(<TodayScreen />, hangData(), { plan: inBlock });
    await fireEvent.press(screen.getByText("Winter base · week 2 of 4"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/plan/block/[id]",
      params: { id: "b1" },
    });
  });

  it("shows no block row outside a block", async () => {
    await renderWithHang(<TodayScreen />, hangData(), { plan: plan("max10") });
    expect(screen.queryByText(/ · week /)).toBeNull();
  });

  it("opens on the day it was sent back to", async () => {
    mockParams = { date: "2026-10-06", at: "1" };
    await renderWithHang(<TodayScreen />, hangData(), { plan: plan("max10") });
    mockParams = {};
    expect(screen.getByText("Next week")).toBeTruthy();
  });

  it("starts today's lifting workout in the sets player with what it prescribes", async () => {
    await renderWithHang(<TodayScreen />, hangData(), { plan: plan("legs"), workouts: [legs] });
    expect(screen.getByText("Up today · Strength")).toBeTruthy();
    expect(screen.getByText("5 × 5")).toBeTruthy();
    expect(screen.queryByText("Log it")).toBeNull();
    await fireEvent.press(screen.getByText("Start"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/workout/sets",
      params: {
        kind: "strength",
        title: "Gym, legs",
        date: "2026-09-29",
        workoutId: "legs",
        minutes: "50",
        items: JSON.stringify([{ exercise: "Back squat", dose: { sets: 5, reps: 5 } }]),
        membershipId: "m1",
        variation: "0",
      },
    });
  });

  it("starts a planned climbing day as a live session linked to the plan", async () => {
    await renderWithHang(<TodayScreen />, hangData(), { plan: plan("climb-limit") });
    await fireEvent.press(screen.getByText("Log session"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/session/live",
      params: expect.objectContaining({ membershipId: "m1" }),
    });
  });
});
