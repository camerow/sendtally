import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import type { Plan, WorkoutRecord } from "@sendtally/api-client";
import { aHang, renderWithHang, hangData } from "../data/renderWithHang";
import { TodayScreen } from "./TodayScreen";

jest.mock("../../../components/Sheet", () => ({
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? children : null,
}));
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
  items: [{ exercise: "Back squat", doses: [{ sets: 5, reps: 5 }] }],
  exerciseRestS: 180,
  focus: null,
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
    expect(screen.getByText("Up today · Fingers")).toBeTruthy();
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

  it("shows a past planned day as missed, with Start to catch it up", async () => {
    await renderWithHang(<TodayScreen />, hangData(), { plan: plan("max10") });
    await fireEvent.press(screen.getByLabelText(/^Monday.*0 done, 1 planned$/));
    expect(screen.getByText("Missed")).toBeTruthy();
    expect(screen.getByText("Start")).toBeTruthy();
  });

  it("shows a planned workout once it is done, under Done, as its logged session", async () => {
    const hang = aHang({ workoutId: "max10", date: "2026-09-28", membershipId: "m1" });
    await renderWithHang(<TodayScreen />, hangData({ sessions: [hang] }), { plan: plan("max10") });
    await fireEvent.press(screen.getByLabelText(/^Monday.*1 done, 0 planned$/));
    expect(screen.getByText("1 done")).toBeTruthy();
    expect(screen.getAllByText("Done")).toHaveLength(1);
    expect(screen.getAllByText("Max hangs")).toHaveLength(1);
  });

  it("counts the week as done of planned", async () => {
    await renderWithHang(<TodayScreen />, hangData(), { plan: plan("max10") });
    expect(screen.getByText("0 of 2 done")).toBeTruthy();
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
        { id: "m1", workoutId: "max10", blockId: "b1", weekdays: [0, 1], start: "2026-09-21" },
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
      params: { id: "b1" },
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

  it("adds to the day picked, naming it", async () => {
    await renderWithHang(<TodayScreen />, hangData(), { plan: plan("max10") });
    expect(screen.getByText("Add to today")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText(/^Monday/));
    await fireEvent.press(screen.getByText("Add to Mon"));
    expect(screen.getByText("What kind?")).toBeTruthy();
    expect(router.push).not.toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/plan/add" })
    );
    await fireEvent.press(screen.getByText("Mobility"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/plan/add",
      params: { date: "2026-09-28", kind: "mobility" },
    });
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
    expect(screen.getByText("Up today · Strength")).toBeTruthy();
    expect(screen.getByText("5 × 5")).toBeTruthy();
    expect(screen.queryByText("Log it")).toBeNull();
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

  it("starts a planned climbing day as a live session linked to the plan", async () => {
    await renderWithHang(<TodayScreen />, hangData(), { plan: plan("climb-limit") });
    await fireEvent.press(screen.getByText("Log session"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/session/live",
      params: expect.objectContaining({ membershipId: "m1" }),
    });
  });
});
