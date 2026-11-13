import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, cleanup, fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import type { Dose } from "@sendtally/core/hang";
import { exerciseTallyStorage } from "../../lib/exerciseTallyStorage";
import { liveRunStorage } from "../../lib/liveRunStorage";
import { anExercise, hangData, renderWithHang } from "../training/data/renderWithHang";
import type { WorkoutRun } from "@sendtally/features/workouts";
import { SetsScreen } from "../training/sets/SetsScreen";
import { TallyScreen } from "./TallyScreen";

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
  useLocalSearchParams: () => ({}),
}));
const mockApi = {
  status: () => new Promise(() => undefined),
  gyms: () => Promise.resolve({ gyms: [] }),
  climbs: () => Promise.resolve({ climbs: [] }),
};

jest.mock("../../lib/api", () => ({ useApi: () => mockApi }));
jest.mock("../../lib/useSessions", () => ({
  useSessions: () => ({ save: () => "manual-1", remove: () => undefined }),
}));
jest.mock("../../lib/liveRunStorage");
jest.mock("../../components/Sheet", () => ({
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? children : null,
}));

const runOf = (dose: Dose): WorkoutRun => ({
  kind: "climbing",
  title: "Power endurance",
  date: "2026-11-04",
  workoutId: "w1",
  link: { membershipId: null, week: null, focus: "power_endurance" },
  minutes: 60,
  exerciseRestS: 0,
  items: [{ exercise: "Circuit laps", dose }],
});

const advance = async (ms: number): Promise<void> => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
};

const both = (dose: Dose): Promise<unknown> =>
  renderWithHang(
    <View>
      <SetsScreen run={runOf(dose)} />
      <TallyScreen exercise />
    </View>,
    hangData(),
    { exercises: [anExercise("e1", "Circuit laps", "climbing", { measure: "laps" })] }
  );

/** Done on the tally, then Finish on the player: the sets the workout keeps. */
async function finished(): Promise<unknown> {
  await fireEvent.press(screen.getByRole("button", { name: "Done" }));
  await fireEvent.press(screen.getByText("Finish"));
  const href = jest.mocked(router.replace).mock.calls.at(-1)?.[0];
  const params = typeof href === "object" ? href.params : undefined;
  return JSON.parse(String(params?.done));
}

describe("Circuit laps on the tally", () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 10, 4, 18, 0) });
  });
  afterEach(() => {
    jest.useRealTimers();
    cleanup();
    exerciseTallyStorage.remove();
    liveRunStorage.remove();
    jest.clearAllMocks();
  });

  it("logs a moves lap clean on Sent, rests on play, and asks how far a Fell lap got", async () => {
    await both({ sets: 2, reps: 40, setRestS: 120 });
    expect(screen.getByText("2 laps of 40 moves")).toBeTruthy();
    await fireEvent.press(screen.getByText("Start"));
    expect(screen.getByText("Lap 1 of 2")).toBeTruthy();
    expect(screen.getByText("Circuit laps · 40 moves")).toBeTruthy();

    await fireEvent.press(screen.getByText("Sent"));
    expect(screen.getByText("Lap 2 of 2")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Start rest"));
    await advance(30_000);
    await fireEvent.press(screen.getByText("Fell"));
    expect(screen.getByText("rest 0:30")).toBeTruthy();
    expect(screen.getByText("Fell after")).toBeTruthy();
    expect(screen.getByText("All laps done")).toBeTruthy();

    expect(await finished()).toEqual([
      { item: 0, exercise: "Circuit laps", sets: [{ reps: 40 }, { reps: 0 }] },
    ]);
  });

  it("times a lap from Start lap, keeps the time so far on Fell, and goes clean at its target", async () => {
    await both({ sets: 2, onS: 60 });
    expect(screen.getByText("2 laps of 1 min")).toBeTruthy();
    await fireEvent.press(screen.getByText("Start"));
    expect(screen.queryByText("Sent")).toBeNull();

    await fireEvent.press(screen.getByText("Start lap"));
    await advance(20_000);
    await fireEvent.press(screen.getByText("Fell"));
    await fireEvent.press(screen.getByText("Start lap"));
    await advance(61_000);
    expect(screen.getByText("All laps done")).toBeTruthy();

    expect(await finished()).toEqual([
      { item: 0, exercise: "Circuit laps", sets: [{ onS: 20 }, { onS: 60 }] },
    ]);
  });
});
