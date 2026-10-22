import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import { hangData, renderWithHang, TODAY } from "../data/renderWithHang";
import { TimerScreen } from "./TimerScreen";

jest.mock("expo-router", () => ({ router: { replace: jest.fn() } }));
jest.mock("expo-keep-awake", () => ({ useKeepAwake: () => undefined }));
jest.mock("expo-audio", () => ({
  useAudioPlayer: () => ({ seekTo: () => Promise.resolve(), play: () => undefined }),
  setAudioModeAsync: () => Promise.resolve(),
}));

const advance = async (ms: number): Promise<void> => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
};

describe("Timer", () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 8, 29, 18) });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("counts down Get ready into the first hang, then credits a hang cut short", async () => {
    await renderWithHang(<TimerScreen workoutId="rep73" gripId="half" />);
    await fireEvent.press(screen.getByText("Start"));
    expect(screen.getByText("Get ready")).toBeTruthy();
    expect(screen.getByText("6 sets ahead")).toBeTruthy();

    await advance(5000);
    expect(screen.getByText("Hang")).toBeTruthy();
    expect(screen.getByText("Set 1 of 6")).toBeTruthy();

    await advance(3100);
    await fireEvent.press(screen.getByText("Came off early · held 3s"));
    expect(screen.getByText("Rest")).toBeTruthy();

    await fireEvent.press(screen.getByText("End"));
    await advance(200);
    expect(router.replace).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/workout/done",
        params: expect.objectContaining({
          ended: "1",
          work: "3",
          misses: "1",
          pct: "1",
          setsDone: "0",
        }),
      })
    );
  });

  it("pauses the clock from the primary button", async () => {
    await renderWithHang(<TimerScreen workoutId="max10" gripId="half" />);
    await fireEvent.press(screen.getByText("Start"));
    await advance(5000);
    await fireEvent.press(screen.getByText("Pause"));
    await advance(60_000);
    expect(screen.getByText("Paused")).toBeTruthy();
    expect(screen.getByText("10")).toBeTruthy();
    await fireEvent.press(screen.getByText("Resume"));
    await advance(4000);
    expect(screen.getByText("6")).toBeTruthy();
  });

  it("sets up the run from today's plan, and carries the setup to the done screen", async () => {
    const schedule = {
      id: "s1",
      workoutId: "max10",
      gripId: "half",
      days: [1 as const],
      start: TODAY,
      end: null,
      skip: [],
      edgeMm: 15,
      loadKg: null,
    };
    const session = {
      id: "h1",
      workoutId: "max10",
      gripId: "half",
      date: "2026-09-20",
      edgeMm: 20,
      loadKg: 8,
      pct: 100,
      misses: 0,
      rpe: null,
      protocol: {
        name: "Max hangs",
        kind: "hang" as const,
        hangS: 10,
        restS: 0,
        reps: 1,
        sets: 5,
        setRestS: 180,
      },
      stravaActivityId: null,
      postState: null,
      postError: null,
      updatedAt: "t",
    };
    await renderWithHang(
      <TimerScreen workoutId="max10" gripId="half" />,
      hangData({ schedules: [schedule], sessions: [session] })
    );
    expect(screen.getByDisplayValue("15")).toBeTruthy();
    expect(screen.getByDisplayValue("8")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Deeper edge"));
    await fireEvent.press(screen.getByText("Start"));
    expect(screen.getByText("Half crimp · 16 mm · +8 kg")).toBeTruthy();
    await fireEvent.press(screen.getByText("End"));
    await advance(200);
    expect(router.replace).toHaveBeenCalledWith(
      expect.objectContaining({ params: expect.objectContaining({ edgeMm: "16", loadKg: "8" }) })
    );
  });
});
