import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import type { WorkoutRun } from "@sendtally/features/workouts";
import { liveRunStorage } from "../../../lib/liveRunStorage";
import { hangData, readingOrder, renderWithHang } from "../data/renderWithHang";
import { SetsScreen } from "./SetsScreen";

jest.mock("expo-router", () => ({
  router: { replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
}));
jest.mock("../../../lib/api", () => ({ useApi: () => undefined }));
jest.mock("../../../lib/liveRunStorage");

const group = { id: "s1", rounds: 2, restBetweenS: 0, restRoundS: 120 };
const run: WorkoutRun = {
  kind: "strength",
  title: "Pull and push",
  date: "2026-11-18",
  workoutId: "w1",
  link: { membershipId: null, week: null, focus: null },
  minutes: 30,
  exerciseRestS: 90,
  items: [
    { exercise: "Pull-ups", dose: { sets: 2, reps: 6 }, group },
    { exercise: "Push-ups", dose: { sets: 2, reps: 15 }, group },
    { exercise: "Plank", dose: { sets: 1, onS: 45 } },
  ],
};

const advance = async (ms: number): Promise<void> => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
};
const tick = (label: string): Promise<void> => fireEvent.press(screen.getByLabelText(label));
const finished = async (): Promise<Record<string, string>> => {
  await fireEvent.press(screen.getByText("Finish"));
  const { params } = (router.replace as jest.Mock).mock.calls.at(-1)![0] as {
    params: Record<string, string>;
  };
  return params;
};

describe("A superset in the workout view", () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 10, 18, 18, 0) });
    liveRunStorage.remove();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("runs round by round as one exercise, resting only after a round when the rest between is none", async () => {
    await renderWithHang(<SetsScreen run={run} />, hangData());
    expect(screen.getByText("Superset · Round 1 of 2")).toBeTruthy();
    expect(screen.getByText("Exercise 1 of 2")).toBeTruthy();
    expect(screen.queryAllByText("Rest 0:00")).toEqual([]);
    await tick("Pull-ups, set 1");
    expect(screen.queryByText("+30s")).toBeNull();
    expect(screen.getByText("Next: Push-ups")).toBeTruthy();
    await tick("Push-ups, set 1");
    expect(screen.getByText("Superset · Round 2 of 2")).toBeTruthy();
    expect(screen.getByText("+30s")).toBeTruthy();
  });

  it("adds a round to every member, and takes a round from every member with one Undo", async () => {
    await renderWithHang(<SetsScreen run={run} />, hangData());
    await fireEvent.press(screen.getByText("Add round"));
    expect(screen.getByLabelText("Pull-ups, set 3")).toBeTruthy();
    expect(screen.getByLabelText("Push-ups, set 3")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("set-row-0-2"));
    await fireEvent.press(screen.getAllByLabelText("Remove set 3")[0]!);
    expect(screen.queryByLabelText("Pull-ups, set 3")).toBeNull();
    expect(screen.queryByLabelText("Push-ups, set 3")).toBeNull();
    await fireEvent.press(screen.getByText("Undo"));
    expect(screen.getByLabelText("Push-ups, set 3")).toBeTruthy();
  });

  it("plays the member left as a plain exercise once the other is skipped", async () => {
    await renderWithHang(<SetsScreen run={run} />, hangData());
    await fireEvent.press(screen.getAllByLabelText("More for this exercise")[0]!);
    await fireEvent.press(screen.getByText("Skip Push-ups for now"));
    expect(screen.queryByText(/^Superset/)).toBeNull();
    expect(screen.getByText("Pull-ups")).toBeTruthy();
  });

  it("moves the superset whole from its menu", async () => {
    await renderWithHang(<SetsScreen run={run} />, hangData());
    await fireEvent.press(screen.getAllByLabelText("More for this exercise")[0]!);
    expect(screen.queryByText("Move up")).toBeNull();
    await fireEvent.press(screen.getByText("Move down"));
    expect(readingOrder("Plank", "Superset · Round 1 of 2")).toEqual([
      "Plank",
      "Superset · Round 1 of 2",
    ]);
  });

  it("logs a half-done round as the sets done, each member with its superset", async () => {
    await renderWithHang(<SetsScreen run={run} />, hangData());
    await tick("Pull-ups, set 1");
    await tick("Push-ups, set 1");
    await tick("Pull-ups, set 2");
    const params = await finished();
    const done = JSON.parse(params.done ?? "[]") as { exercise: string; group?: unknown }[];
    expect(done.slice(0, 2).map((d) => [d.exercise, d.group])).toEqual([
      ["Pull-ups", { id: "s1", rounds: 2 }],
      ["Push-ups", { id: "s1", rounds: 2 }],
    ]);
    expect(JSON.parse(params.off ?? "[]")).toEqual(["1:1", "2:0"]);
  });

  it("resumes a run reloaded mid-superset on the round it was on, its rest still running", async () => {
    const view = await renderWithHang(<SetsScreen run={run} />, hangData());
    await tick("Pull-ups, set 1");
    await tick("Push-ups, set 1");
    await advance(30_000);
    await view.unmount();
    await renderWithHang(<SetsScreen run={run} />, hangData());
    expect(screen.getByText("Superset · Round 2 of 2")).toBeTruthy();
    expect(screen.getByText("+30s")).toBeTruthy();
    expect(screen.getByLabelText("Pull-ups, set 1")).toHaveProp("accessibilityState", {
      checked: true,
    });
  });

  it("ends the run at its last tick in a superset when it sat open over 20 minutes after", async () => {
    await renderWithHang(<SetsScreen run={run} />, hangData());
    await advance(10 * 60_000);
    await tick("Pull-ups, set 1");
    await advance(2 * 60 * 60_000);
    const params = await finished();
    expect([params.minutes, params.idle]).toEqual(["10", "120"]);
  });
});
