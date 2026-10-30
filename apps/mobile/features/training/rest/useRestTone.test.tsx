import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react-native";
import { useAudioPlayer } from "expo-audio";
import { liveRunStorage } from "../../../lib/liveRunStorage";
import { writeLiveRun, writeRest } from "../../live-session/liveRun";
import { restAfter } from "./restCountdown";
import { useRestTone } from "./useRestTone";

jest.mock("../../../lib/liveRunStorage");

describe("Rest tone", () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 9, 30, 18) });
    liveRunStorage.remove();
    writeLiveRun({
      title: "Leg day",
      workoutId: "w1",
      pathname: "/workout/sets",
      params: {},
      startedAt: Date.now(),
      state: { player: "sets", done: [], ticked: [] },
    });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("plays at the end of the live run's rest with no player open, and not for one skipped", async () => {
    const tone = jest.spyOn(useAudioPlayer(0), "play");
    tone.mockClear();
    await renderHook(useRestTone);
    await act(async () => writeRest(restAfter("0:0", 60, null, Date.now())));
    await act(async () => {
      jest.advanceTimersByTime(59_000);
    });
    expect(tone).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(1_000);
    });
    expect(tone).toHaveBeenCalledTimes(1);

    await act(async () => writeRest(restAfter("0:1", 60, null, Date.now())));
    await act(async () => writeRest(null));
    await act(async () => {
      jest.advanceTimersByTime(120_000);
    });
    expect(tone).toHaveBeenCalledTimes(1);
  });
});
