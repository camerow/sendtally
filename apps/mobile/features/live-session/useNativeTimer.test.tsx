import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react-native";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { AppState, type AppStateStatus } from "react-native";
import { startRun, togglePause } from "@sendtally/core/hang";
import { liveRunStorage } from "../../lib/liveRunStorage";
import { sync } from "../../modules/native-timer";
import { restAfter } from "../training/rest/restCountdown";
import { clearLiveRun, writeLiveRun, writeLiveRunAsIs, type LiveRun } from "./liveRun";
import { useNativeTimer } from "./useNativeTimer";

jest.mock("../../lib/liveRunStorage");
jest.mock("../../lib/exerciseTallyStorage", () => ({
  exerciseTallyStorage: { remove: () => undefined },
}));

const run = (now: number): LiveRun => ({
  title: "Repeaters",
  workoutId: "w1",
  pathname: "/workout/timer",
  params: {},
  startedAt: now,
  state: {
    player: "timer",
    run: startRun(
      { name: "Repeaters", kind: "hang", hangS: 7, restS: 3, reps: 6, sets: 6, setRestS: 180 },
      now
    ),
  },
});

const lastSync = (): unknown => jest.mocked(sync).mock.calls.at(-1)?.[0];

describe("the system timer hook", () => {
  let onChange: ((state: AppStateStatus) => void) | undefined;
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 10, 2, 18) });
    liveRunStorage.remove();
    jest.mocked(sync).mockClear();
    jest.mocked(activateKeepAwakeAsync).mockClear();
    jest.mocked(deactivateKeepAwake).mockClear();
    jest.spyOn(AppState, "addEventListener").mockImplementation((_, listener) => {
      onChange = listener;
      return { remove: () => undefined };
    });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("hands each live run change to the system and ends it on clear", async () => {
    await renderHook(useNativeTimer);
    expect(sync).toHaveBeenLastCalledWith(null);
    await act(async () => writeLiveRun(run(Date.now())));
    expect(lastSync()).toMatchObject({ title: "Repeaters", pausedLeftS: null });
    await act(async () => clearLiveRun());
    expect(sync).toHaveBeenLastCalledWith(null);
  });

  it("resyncs on return to the app", async () => {
    await act(async () => writeLiveRun(run(Date.now())));
    await renderHook(useNativeTimer);
    await act(async () => Promise.resolve());
    const calls = jest.mocked(sync).mock.calls.length;
    jest.advanceTimersByTime(33_000);
    await act(async () => {
      onChange?.("active");
      await Promise.resolve();
    });
    expect(jest.mocked(sync).mock.calls.length).toBeGreaterThan(calls);
    expect((lastSync() as { steps: { label: string }[] }).steps[0]?.label).toBe("Rest");
  });

  it("keeps the screen on while a clock counts", async () => {
    await renderHook(useNativeTimer);
    const live = run(Date.now());
    await act(async () => writeLiveRun(live));
    expect(activateKeepAwakeAsync).toHaveBeenCalledTimes(1);
    const { state } = live;
    if (state.player !== "timer") throw new Error("timer");
    const paused = { ...state, run: togglePause(state.run, Date.now()) };
    await act(async () => writeLiveRun({ ...live, state: paused }));
    expect(deactivateKeepAwake).toHaveBeenCalledTimes(1);

    const rest = restAfter("0:0", 60, null, Date.now()) ?? undefined;
    await act(async () =>
      writeLiveRunAsIs({
        ...live,
        pathname: "/workout/sets",
        state: { player: "sets", done: [], ticked: [] },
        rest,
      })
    );
    expect(activateKeepAwakeAsync).toHaveBeenCalledTimes(2);
    await act(async () => {
      jest.advanceTimersByTime(60_000);
    });
    expect(deactivateKeepAwake).toHaveBeenCalledTimes(2);
  });
});
