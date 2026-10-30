import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import type * as LogSession from "@sendtally/features/log-session";
import { liveRunStorage } from "../../../lib/liveRunStorage";
import { readLiveRun } from "../../live-session/liveRun";
import { NO_PLAN } from "../data/planLinkParams";
import type { TimerRun } from "../done/doneParams";
import { hangData, renderWithHang, TODAY } from "../data/renderWithHang";
import { TimerScreen } from "./TimerScreen";

jest.mock("expo-router", () => ({ router: { replace: jest.fn() } }));
jest.mock("expo-keep-awake", () => ({ useKeepAwake: () => undefined }));
jest.mock("../../../lib/liveRunStorage", () => {
  let value: string | null = null;
  return {
    liveRunStorage: jest
      .requireActual<typeof LogSession>("@sendtally/features/log-session")
      .draftStorage({
        read: () => value,
        write: (next) => {
          value = next;
        },
        remove: () => {
          value = null;
        },
      }),
  };
});

/** What the timer handed its review. */
const reviewed = (): { params: Record<string, string>; run: TimerRun } => {
  const href = jest.mocked(router.replace).mock.calls.at(-1)?.[0] as {
    params: Record<string, string>;
  };
  return { params: href.params, run: JSON.parse(href.params.run ?? "null") as TimerRun };
};

const advance = async (ms: number): Promise<void> => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
};

describe("Timer", () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 8, 29, 18) });
    liveRunStorage.remove();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("counts down Get ready into the first hang, then credits a hang cut short", async () => {
    await renderWithHang(
      <TimerScreen workoutId="rep73" gripId="half" link={NO_PLAN} session={0} />
    );
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
      expect.objectContaining({ pathname: "/workout/done" })
    );
    const { run } = reviewed();
    expect(run.done[0]?.sets).toHaveLength(6);
    expect(run.off).toEqual(["0:0", "0:1", "0:2", "0:3", "0:4", "0:5"]);
  });

  it("keeps the run on disk, and picks it up past the setup where it was", async () => {
    const view = await renderWithHang(
      <TimerScreen workoutId="rep73" gripId="half" link={NO_PLAN} session={0} />
    );
    await fireEvent.press(screen.getByText("Start"));
    await advance(5100);
    expect(readLiveRun()).toMatchObject({
      title: "Repeaters 7:3",
      pathname: "/workout/timer",
      params: { workoutId: "rep73", gripId: "half", session: "0" },
      state: { player: "timer", setups: [expect.anything()] },
    });
    await view.unmount();

    await renderWithHang(
      <TimerScreen workoutId="rep73" gripId="half" link={NO_PLAN} session={0} />
    );
    expect(screen.queryByText("Start")).toBeNull();
    expect(screen.getByText("Hang")).toBeTruthy();
    expect(screen.getByText("Set 1 of 6")).toBeTruthy();
  });

  it("pauses the clock from the primary button", async () => {
    await renderWithHang(
      <TimerScreen workoutId="max10" gripId="half" link={NO_PLAN} session={0} />
    );
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

  it("runs the week's prescription, and carries the setup and plan to the done screen", async () => {
    const plan = {
      blocks: [{ id: "b1", name: "Winter base", start: TODAY, weeks: 4, focus: null }],
      memberships: [
        { id: "m1", workoutId: "max10", blockId: "b1", weekdays: [1 as const], start: TODAY },
      ],
      weekChanges: [
        { membershipId: "m1", week: 1, dose: 0, item: 0, change: { sets: 3, edgeMm: 15 } },
      ],
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
      membershipId: null,
      week: null,
      focus: null,
      done: [],
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
      <TimerScreen
        workoutId="max10"
        gripId="half"
        link={{ membershipId: "m1", week: 1, focus: null }}
        session={0}
      />,
      hangData({ sessions: [session] }),
      { plan }
    );
    expect(screen.getByLabelText("Edge depth").props.accessibilityValue).toEqual({ text: "15 mm" });
    expect(screen.getByLabelText("Added weight").props.accessibilityValue).toEqual({
      text: "8 kg",
    });
    await fireEvent.press(screen.getByLabelText("Deeper edge"));
    await fireEvent.press(screen.getByText("Start"));
    expect(screen.getByText("Half crimp · 16\u00A0mm · +8 kg")).toBeTruthy();
    expect(screen.getByText("3 sets ahead")).toBeTruthy();
    await fireEvent.press(screen.getByText("End"));
    await advance(200);
    const { params, run } = reviewed();
    expect(params).toMatchObject({ membershipId: "m1", week: "1", session: "0" });
    expect(run.setups).toEqual([{ edgeMm: 16, loadKg: 8 }]);
    expect(run.done[0]?.sets).toHaveLength(3);
  });

  it("rests between exercises, runs the next grip, and carries every item to the done screen", async () => {
    const twoGrips = {
      id: "w-two",
      kind: "hangboard" as const,
      name: "Two grips",
      description: "",
      minutes: null,
      targetRpe: null,
      items: [
        { exercise: "half", doses: [{ sets: 1, reps: 1, onS: 10 }] },
        { exercise: "open", doses: [{ sets: 1, reps: 1, onS: 10 }] },
      ],
      exerciseRestS: 120,
      focus: null,
      updatedAt: "t",
    };
    await renderWithHang(
      <TimerScreen workoutId="w-two" gripId="half" link={NO_PLAN} session={0} />,
      hangData(),
      { workouts: [twoGrips] }
    );
    expect(screen.getByText("Set up · Half crimp · Open hand")).toBeTruthy();
    await fireEvent.press(screen.getByText("Start"));
    await advance(5000);
    expect(screen.getByText("Rest 2:00, then the next exercise")).toBeTruthy();
    await advance(10_000);
    expect(screen.getByText("Rest")).toBeTruthy();
    expect(screen.getByText("2:00")).toBeTruthy();
    expect(screen.getByText(/^Open hand · /)).toBeTruthy();
    await advance(119_000);
    expect(screen.getByText("Rest")).toBeTruthy();
    await advance(1000);
    expect(screen.getByText("Hang")).toBeTruthy();
    await advance(10_100);
    const { params, run } = reviewed();
    expect(params).toMatchObject({ workoutId: "w-two", gripId: "half" });
    expect(run.done).toEqual([
      { item: 0, exercise: "half", sets: [{ reps: 1, onS: 10 }] },
      { item: 1, exercise: "open", sets: [{ reps: 1, onS: 10 }] },
    ]);
    expect(run.off).toEqual([]);
    expect(run.setups).toHaveLength(2);
  });
});
