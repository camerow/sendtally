import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import type { IntervalsRun } from "./intervalsParams";
import { IntervalsScreen } from "./IntervalsScreen";

const mockActions = { saveActivity: jest.fn(), deleteActivity: jest.fn() };

jest.mock("expo-router", () => ({ router: { dismissAll: jest.fn(), back: jest.fn() } }));
jest.mock("expo-crypto", () => ({ randomUUID: () => "activity-1" }));
jest.mock("expo-keep-awake", () => ({ useKeepAwake: () => undefined }));
jest.mock("expo-audio", () => ({
  useAudioPlayer: () => ({ seekTo: () => Promise.resolve(), play: () => undefined }),
  setAudioModeAsync: () => Promise.resolve(),
}));
jest.mock("../../../lib/api", () => ({ useApi: () => undefined }));
jest.mock("@sendtally/features/activities", () => ({
  ...jest.requireActual<object>("@sendtally/features/activities"),
  useActivityActions: () => mockActions,
  useWeightUnit: () => "kg",
}));

const workout: IntervalsRun = {
  kind: "mobility",
  title: "Hip mobility flow",
  date: "2026-10-22",
  planItemId: "p1",
  activityId: null,
  body: {
    kind: "intervals",
    rounds: 1,
    steps: [
      {
        label: "Couch stretch",
        measure: "time",
        seconds: 45,
        side: "each",
        restAfter: 10,
        cue: "Squeeze the glute",
      },
      { label: "Swing", measure: "count", count: 15, loadKg: 24, restAfter: 0 },
    ],
  },
};

const advance = async (ms: number): Promise<void> => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
};

describe("Intervals player", () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 9, 22, 18, 5) });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("plays each side, waits for a counted step, and saves what was done", async () => {
    await render(<IntervalsScreen workout={workout} />);
    expect(screen.getByText("Get ready")).toBeTruthy();
    expect(screen.getByText("0:45 · each side")).toBeTruthy();

    await advance(5000);
    expect(screen.getByText("Hold · left side")).toBeTruthy();
    expect(screen.getByText("Squeeze the glute")).toBeTruthy();
    expect(screen.getByText("Up next")).toBeTruthy();

    await advance(45_000 + 20_000);
    await fireEvent.press(screen.getByText("Stopped early · held 20s"));
    expect(screen.getByText("Rest")).toBeTruthy();

    await advance(10_000);
    expect(screen.getByText("× 15")).toBeTruthy();
    await fireEvent.press(screen.getAllByText("Done")[0]!);

    expect(screen.getByText("Steps done")).toBeTruthy();
    expect(screen.getByText("3/3")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Effort 6 of 10"));
    await fireEvent.press(screen.getByText("Save activity"));

    expect(mockActions.saveActivity).toHaveBeenCalledWith({
      id: "activity-1",
      kind: "mobility",
      title: "Hip mobility flow",
      date: "2026-10-22",
      startTime: "18:05",
      minutes: 1,
      rpe: 6,
      notes: null,
      planItemId: "p1",
      detail: {
        ...workout.body,
        stepsDone: [
          { round: 0, step: 0, side: "L" },
          { round: 0, step: 0, side: "R", heldSeconds: 20 },
          { round: 0, step: 1 },
        ],
      },
    });
    expect(router.dismissAll).toHaveBeenCalled();
  });
});
