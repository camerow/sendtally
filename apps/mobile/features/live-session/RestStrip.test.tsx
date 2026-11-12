import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, render, screen } from "@testing-library/react-native";
import React from "react";
import { liveRunStorage } from "../../lib/liveRunStorage";
import { restAfter } from "@sendtally/features/workouts";
import { writeLiveRun, writeRest } from "./liveRun";
import { RestStrip } from "./RestStrip";

jest.mock("../../lib/liveRunStorage");

const advance = async (ms: number): Promise<void> => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
};

describe("Rest strip", () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 9, 30, 18) });
    liveRunStorage.remove();
    writeLiveRun({
      title: "Leg day",
      workoutId: "w1",
      pathname: "/workout/sets",
      params: {},
      startedAt: Date.now(),
      state: { player: "sets", done: [], ticked: ["0:0"] },
    });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows while a rest runs, says what comes after it, and leaves at zero", async () => {
    await render(<RestStrip />);
    expect(screen.queryByText("Rest 1:30")).toBeNull();
    await act(async () => writeRest(restAfter("0:0", 90, null, Date.now())));
    expect(screen.getByText("Rest 1:30")).toBeTruthy();
    expect(screen.getByText("· then set 2")).toBeTruthy();
    await advance(48_000);
    expect(screen.getByLabelText("Rest, 0:42 left")).toBeTruthy();
    await advance(42_000);
    expect(screen.queryByText("Rest 0:00")).toBeNull();
    expect(screen.queryByText("· then set 2")).toBeNull();
  });

  it("names the exercise a rest between exercises comes before", async () => {
    await act(async () => writeRest(restAfter("after:0", 150, "Romanian deadlift", Date.now())));
    await render(<RestStrip />);
    expect(screen.getByText("Rest 2:30")).toBeTruthy();
    expect(screen.getByText("· then Romanian deadlift")).toBeTruthy();
  });
});
