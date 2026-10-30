import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import type * as LogSession from "@sendtally/features/log-session";
import { statsSegmentStorage } from "../../../lib/statsSegmentStorage";
import { hangData, renderWithHang, TODAY } from "../data/renderWithHang";
import { DoneScreen } from "./DoneScreen";
import type { DoneParams } from "./doneParams";

jest.mock("expo-router", () => ({
  router: { dismissTo: jest.fn(), push: jest.fn(), back: jest.fn() },
}));
jest.mock("../../../lib/statsSegmentStorage", () => {
  let value: string | null = null;
  return {
    statsSegmentStorage: jest
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
jest.mock("expo-crypto", () => ({ randomUUID: () => "session-1" }));

const set = { reps: 6, onS: 7, offS: 3, setRestS: 180 };

const ended: DoneParams = {
  workoutId: "rep73",
  gripId: "half",
  link: { membershipId: "m1", week: 3, focus: null },
  session: 0,
  run: {
    done: [{ item: 0, exercise: "half", sets: [set, set, set, { ...set, reps: 4 }, set, set] }],
    off: ["0:4", "0:5"],
    setups: [{ edgeMm: 20, loadKg: 4 }],
    startedAt: new Date(`${TODAY}T18:00:00`).getTime(),
  },
};

describe("A hangboard workout's review", () => {
  it("shows what the timer saw, and saves the sets as they were confirmed", async () => {
    const { actions } = await renderWithHang(<DoneScreen params={ended} />);
    expect(screen.getByText("Log workout")).toBeTruthy();
    expect(screen.getByText("Fingers · Ended at set 4 of 6")).toBeTruthy();
    expect(
      screen.getByText(
        "From the timer: 3 sets full, 1 partial, 2 not done. Fix anything before saving."
      )
    ).toBeTruthy();
    expect(screen.getByText("4 of 6")).toBeTruthy();
    expect(screen.getByLabelText("Half crimp, set 5").props.accessibilityState).toEqual({
      checked: false,
    });

    await fireEvent.press(screen.getByLabelText("Half crimp, set 5"));
    await fireEvent.press(screen.getByLabelText("Shallower edge"));
    await fireEvent.press(screen.getByLabelText("Effort 8 of 10"));
    await fireEvent.press(screen.getByText("Save"));

    const done = { edgeMm: 19, weightKg: 4 };
    expect(actions.saveSession).toHaveBeenCalledWith({
      id: "session-1",
      workoutId: "rep73",
      gripId: "half",
      date: TODAY,
      edgeMm: 19,
      loadKg: 4,
      pct: 78,
      misses: 2,
      rpe: 8,
      protocol: expect.objectContaining({ name: "Repeaters 7:3", hangS: 7, sets: 6 }),
      membershipId: "m1",
      week: 3,
      focus: null,
      done: [
        {
          item: 0,
          exercise: "half",
          sets: [
            { ...set, ...done },
            { ...set, ...done },
            { ...set, ...done },
            { ...set, reps: 4, ...done },
            { ...set, ...done },
          ],
        },
      ],
    });
    expect(router.dismissTo).toHaveBeenCalledWith("/(tabs)/stats");
    expect(statsSegmentStorage.read()).toBe("training");
  });

  it("logs it without the timer as every set of every item at the planned dose", async () => {
    const twoGrips = {
      id: "w-two",
      kind: "hangboard" as const,
      name: "Two grips",
      description: "",
      minutes: null,
      targetRpe: null,
      items: [
        { exercise: "half", doses: [{ sets: 2, reps: 1, onS: 10, setRestS: 60 }] },
        { exercise: "open", doses: [{ sets: 3, reps: 1, onS: 10, setRestS: 60 }] },
      ],
      exerciseRestS: 120,
      focus: null,
      updatedAt: "t",
    };
    const { actions } = await renderWithHang(
      <DoneScreen
        params={{
          workoutId: "w-two",
          gripId: "half",
          link: { membershipId: null, week: null, focus: null },
          session: 0,
          run: null,
        }}
      />,
      hangData(),
      { workouts: [twoGrips] }
    );
    expect(screen.getByText("Fingers · Logged, not timed")).toBeTruthy();
    expect(screen.queryByText(/From the timer/)).toBeNull();
    await fireEvent.press(screen.getByText("Save"));
    const saved = jest.mocked(actions.saveSession).mock.calls[0]?.[0];
    expect(saved).toMatchObject({ workoutId: "w-two", pct: 100, misses: 0 });
    expect(saved?.done.map((d) => [d.exercise, d.sets.length])).toEqual([
      ["half", 2],
      ["open", 3],
    ]);
  });
});
