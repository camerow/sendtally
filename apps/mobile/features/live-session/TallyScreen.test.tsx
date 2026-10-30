import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import { exerciseTallyStorage } from "../../lib/exerciseTallyStorage";
import { anExercise, hangData, renderWithHang } from "../training/data/renderWithHang";
import type { WorkoutRun } from "../training/data/workoutRunParams";
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
jest.mock("../../components/Sheet", () => ({
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? children : null,
}));

const run: WorkoutRun = {
  kind: "climbing",
  title: "Power endurance",
  date: "2026-10-28",
  workoutId: "w1",
  link: { membershipId: null, week: null, focus: "power_endurance" },
  minutes: 60,
  exerciseRestS: 0,
  items: [
    { exercise: "4x4s", dose: { sets: 2, reps: 2, setRestS: 240 } },
    { exercise: "Core circuit", dose: { sets: 1, reps: 10 } },
  ],
};

const advance = async (ms: number): Promise<void> => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
};

/** The player with the tally above it, as the stack holds them once Start opens the tally. */
const both = (): Promise<unknown> =>
  renderWithHang(
    <View>
      <SetsScreen run={run} />
      <TallyScreen exercise />
    </View>,
    hangData(),
    {
      exercises: [
        anExercise("e1", "4x4s", "climbing"),
        anExercise("e2", "Core circuit", "strength", { measure: "reps" }),
      ],
    }
  );

const go = async (grade: string, outcome: "Sent" | "Fell"): Promise<void> => {
  await fireEvent.press(screen.getByLabelText(grade));
  await fireEvent.press(screen.getByText(outcome));
};

describe("The tally in exercise mode", () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 9, 28, 18, 0) });
  });
  afterEach(() => {
    jest.useRealTimers();
    exerciseTallyStorage.remove();
  });

  it("logs a climbing exercise set by set, rests between, and hands the climbs to the workout", async () => {
    await both();
    expect(screen.getByText("2 sets of 2 climbs")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Done" })).toBeNull();

    await fireEvent.press(screen.getByText("Start"));
    expect(router.push).toHaveBeenCalledWith("/workout/tally");
    expect(screen.getByRole("button", { name: "Done" })).toBeTruthy();
    expect(screen.getByText("4x4s · Set 1 of 2 · 0 of 2 climbs")).toBeTruthy();

    await go("V4", "Sent");
    await go("V3", "Fell");
    expect(screen.getByText("Rest 4:00")).toBeTruthy();
    expect(screen.getByText("4x4s · Set 2 of 2 next")).toBeTruthy();
    await advance(60_000);
    expect(screen.getByText("Rest 3:00")).toBeTruthy();
    await fireEvent.press(screen.getByText("+30s"));
    expect(screen.getByText("Rest 3:30")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("V5"));
    expect(screen.queryByText("Skip rest")).toBeNull();
    await fireEvent.press(screen.getByText("Sent"));
    expect(screen.getByText("4x4s · Set 2 of 2 · 1 of 2 climbs")).toBeTruthy();
    expect(screen.getByText("Set 1 · 2 of 2 climbs")).toBeTruthy();

    await fireEvent.press(screen.getByRole("button", { name: "Done" }));
    expect(router.back).toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Done" })).toBeNull();
    expect(screen.getByText("3 climbs · 2 sent · top V5")).toBeTruthy();

    await fireEvent.press(screen.getByLabelText("Core circuit, set 1"));
    await fireEvent.press(screen.getByText("Finish"));
    const href = jest.mocked(router.replace).mock.calls.at(-1)?.[0];
    const params = typeof href === "object" ? href.params : undefined;
    expect(params?.kind).toBe("climbing");
    expect(JSON.parse(String(params?.done))).toEqual([
      {
        item: 0,
        exercise: "4x4s",
        sets: [
          {
            climbs: [
              { grade: "V4", scale: "v", tries: 1, sent: true, style: "flash" },
              { grade: "V3", scale: "v", tries: 1, sent: false },
            ],
          },
          { climbs: [{ grade: "V5", scale: "v", tries: 1, sent: true, style: "flash" }] },
        ],
      },
      { item: 1, exercise: "Core circuit", sets: [{ reps: 10 }] },
    ]);
  });

  it("closes the climb and the grade when a set ends, and undo takes the set change back", async () => {
    await renderWithHang(
      <View>
        <SetsScreen run={{ ...run, items: [{ exercise: "4x4s", dose: { sets: 4, reps: 4 } }] }} />
        <TallyScreen exercise />
      </View>,
      hangData(),
      { exercises: [anExercise("e1", "4x4s", "climbing")] }
    );
    await fireEvent.press(screen.getByText("Start"));
    await go("V4", "Sent");
    await go("V5", "Sent");
    await go("V6", "Sent");
    await go("V7", "Fell");

    expect(screen.getByText("4x4s · Set 2 of 4 · 0 of 4 climbs")).toBeTruthy();
    expect(screen.getByLabelText("V7, 1 fall")).not.toBeSelected();
    expect(screen.queryByLabelText("Edit climb")).toBeNull();
    expect(screen.getByLabelText("V7")).not.toBeSelected();
    expect(screen.getByRole("button", { name: "Fell" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Sent" })).toBeDisabled();

    await fireEvent.press(screen.getByText("Undo"));
    expect(screen.getByText("4x4s · Set 1 of 4 · 3 of 4 climbs")).toBeTruthy();
    expect(screen.queryByLabelText("V7, 1 fall")).toBeNull();
    expect(screen.getByLabelText("V7")).toBeSelected();
    expect(screen.getByRole("button", { name: "Sent" })).toBeEnabled();
  });

  it("closes the climb and the grade when a time set runs out on its own", async () => {
    await renderWithHang(
      <View>
        <SetsScreen run={{ ...run, items: [{ exercise: "ARC", dose: { sets: 2, onS: 60 } }] }} />
        <TallyScreen exercise />
      </View>,
      hangData(),
      { exercises: [anExercise("e1", "ARC", "climbing", { measure: "seconds" })] }
    );
    await fireEvent.press(screen.getByText("Start"));
    await go("V1", "Fell");
    expect(screen.getByLabelText("V1, 1 fall")).toBeSelected();

    await advance(61_000);
    expect(screen.getByLabelText("V1, 1 fall")).not.toBeSelected();
    expect(screen.queryByLabelText("Edit climb")).toBeNull();
    expect(screen.getByRole("button", { name: "Fell" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Sent" })).toBeDisabled();
  });

  it("stops the rest a set's last climb started when that climb is undone", async () => {
    await both();
    await fireEvent.press(screen.getByText("Start"));
    await go("V4", "Sent");
    await go("V3", "Fell");
    expect(screen.getByText("Rest 4:00")).toBeTruthy();

    await fireEvent.press(screen.getByText("Undo"));
    expect(screen.queryByText("Rest 4:00")).toBeNull();
    expect(screen.getByText("4x4s · Set 1 of 2 · 1 of 2 climbs")).toBeTruthy();
    expect(screen.getByLabelText("V3")).toBeSelected();
  });

  it("counts a time set down from its first grade, and lets the climb on the wall finish", async () => {
    await renderWithHang(
      <View>
        <SetsScreen
          run={{ ...run, items: [{ exercise: "ARC", dose: { sets: 2, onS: 60, setRestS: 30 } }] }}
        />
        <TallyScreen exercise />
      </View>,
      hangData(),
      { exercises: [anExercise("e1", "ARC", "climbing", { measure: "seconds" })] }
    );
    expect(screen.getByText("2 × 1:00 on the wall")).toBeTruthy();
    await fireEvent.press(screen.getByText("Start"));
    expect(screen.getByText("1:00 left")).toBeTruthy();
    await go("V1", "Sent");
    await advance(40_000);
    expect(screen.getByText("0:20 left")).toBeTruthy();
    expect(screen.getByText("ARC · Set 1 of 2 · 1 lap")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("V2"));
    await advance(30_000);
    expect(screen.getByText("0:00 left")).toBeTruthy();
    await fireEvent.press(screen.getByText("Fell"));
    expect(screen.getByText("ARC · Set 2 of 2 next")).toBeTruthy();
    expect(screen.getByText("Rest 0:30")).toBeTruthy();
    await fireEvent.press(screen.getByText("Skip rest"));
    expect(screen.getByText("1:00 left")).toBeTruthy();
  });
});
